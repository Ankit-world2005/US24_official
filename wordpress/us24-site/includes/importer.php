<?php
/**
 * Content importer: creates the us24solutions.com pages, posts, synced patterns and media from content/pages.json.
 *
 * Safe to run more than once and safe on a site that already has these pages:
 * - Items are tracked by `_us24_import_key`. Re-running updates them, unless someone edited them since.
 * - A page this plugin did not create is skipped, unless "replace" is on. Then its title, content, template
 *   and Elementor flags are backed up to `_us24_backup` first, and us24_site_undo() puts them back.
 * - Reading settings, permalinks and the site title are saved before they change and restored by undo.
 *
 * @package US24_Site
 */

defined( 'ABSPATH' ) || exit;

/**
 * The bundled content package.
 *
 * @return array{version:string,generated:string,source:string,media:array,blocks:array,items:array}
 */
function us24_site_package() {
	static $pkg = null;
	if ( null === $pkg ) {
		$file = US24_SITE_DIR . 'content/pages.json';
		$data = is_readable( $file ) ? json_decode( (string) file_get_contents( $file ), true ) : null; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local file.
		$pkg  = wp_parse_args(
			is_array( $data ) ? $data : array(),
			array( 'version' => '0', 'generated' => '', 'source' => '', 'media' => array(), 'blocks' => array(), 'items' => array() )
		);
	}
	return $pkg;
}

/**
 * Run the import.
 *
 * @param array $args {
 *     @type bool $replace    Take over existing pages with the same URL (backed up first). Default false.
 *     @type bool $force      Overwrite imported items even if they were edited since. Default false.
 *     @type bool $reading    Set Home as the front page and Blog as the posts page. Default true.
 *     @type bool $permalinks Switch to /%postname%/ so URLs match the live site. Default true.
 *     @type bool $identity   Set the site title and tagline if they are still the WordPress defaults. Default true.
 * }
 * @return array Report.
 */
function us24_site_import( $args = array() ) {
	$args = wp_parse_args( $args, array( 'replace' => false, 'force' => false, 'reading' => true, 'permalinks' => true, 'identity' => true ) );
	$pkg  = us24_site_package();

	if ( function_exists( 'set_time_limit' ) ) {
		@set_time_limit( 300 ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- not allowed on some hosts.
	}
	// The package is trusted, bundled content; keep its markup byte-for-byte (kses would re-encode block attributes).
	kses_remove_filters();

	$report = array( 'media' => array(), 'blocks' => array(), 'items' => array(), 'settings' => array() );
	$media  = array();
	foreach ( $pkg['media'] as $file => $info ) {
		$r = us24_site_import_media( $file, (array) $info );
		if ( is_wp_error( $r ) ) {
			$report['media'][] = array( 'file' => $file, 'action' => 'error', 'note' => $r->get_error_message() );
			continue;
		}
		$media[ $file ]    = $r;
		$report['media'][] = array( 'file' => $file, 'action' => $r['action'], 'id' => $r['id'] );
	}

	$blocks = array();
	foreach ( $pkg['blocks'] as $b ) {
		$content            = us24_site_resolve( $b['content'], $media, $blocks );
		$r                  = us24_site_upsert( array( 'type' => 'wp_block', 'slug' => 'us24-' . $b['key'], 'key' => 'block:' . $b['key'], 'title' => $b['title'], 'status' => 'publish' ), $content, $args );
		$blocks[ $b['key'] ] = $r['id'] ?? 0;
		$report['blocks'][] = $r;
	}

	$ids = array();
	foreach ( $pkg['items'] as $item ) {
		$item['key']        = $item['slug'];
		$r                  = us24_site_upsert( $item, us24_site_resolve( $item['content'], $media, $blocks ), $args );
		$ids[ $item['slug'] ] = $r['id'] ?? 0;
		$report['items'][]  = $r;
	}

	kses_init();
	$report['settings'] = us24_site_apply_settings( $pkg, $ids, $args );

	update_option(
		'us24_site_import',
		array( 'version' => $pkg['version'], 'time' => time(), 'args' => $args, 'report' => $report ),
		false
	);
	return $report;
}

/**
 * Replace {{home}}, {{media:file}}, {{media-id:file}} and {{block:key}} placeholders.
 *
 * @param string $content Block markup.
 * @param array  $media   file => [id, url].
 * @param array  $blocks  key => wp_block ID.
 * @return string
 */
function us24_site_resolve( $content, $media, $blocks ) {
	$home = untrailingslashit( home_url() );
	return preg_replace_callback(
		'/\{\{(home|media|media-id|block)(?::([^}]+))?\}\}/',
		static function ( $m ) use ( $home, $media, $blocks ) {
			$key = $m[2] ?? '';
			switch ( $m[1] ) {
				case 'home':
					return $home;
				case 'media':
					return isset( $media[ $key ] ) ? $media[ $key ]['url'] : '';
				case 'media-id':
					return isset( $media[ $key ] ) ? (string) $media[ $key ]['id'] : '0';
				default:
					return isset( $blocks[ $key ] ) ? (string) $blocks[ $key ] : '0';
			}
		},
		(string) $content
	);
}

/**
 * Create or update one page, post or synced pattern.
 *
 * @param array  $item    Package item (type, slug, key, title, status, template, order, description, notes, excerpt, date).
 * @param string $content Resolved block markup.
 * @param array  $args    Import arguments.
 * @return array Report row.
 */
function us24_site_upsert( $item, $content, $args ) {
	$type = $item['type'] ?? 'page';
	$row  = array( 'type' => $type, 'slug' => $item['slug'], 'title' => $item['title'], 'action' => '', 'note' => '', 'id' => 0 );

	$existing = us24_site_find_imported( $item['key'], $type );
	if ( ! $existing && 'wp_block' !== $type ) {
		$existing = get_page_by_path( $item['slug'], OBJECT, $type );
	}

	$data = array(
		'post_type'      => $type,
		'post_title'     => $item['title'],
		'post_name'      => $item['slug'],
		'post_content'   => $content,
		'post_status'    => $item['status'] ?? 'publish',
		'menu_order'     => (int) ( $item['order'] ?? 0 ),
		'post_excerpt'   => $item['excerpt'] ?? '',
		'comment_status' => 'closed',
		'ping_status'    => 'closed',
	);
	if ( 'post' === $type && ! empty( $item['date'] ) ) {
		$data['post_date'] = $item['date'];
	}

	$action = 'created';
	if ( $existing ) {
		$row['id'] = $existing->ID;
		if ( get_post_meta( $existing->ID, '_us24_import_key', true ) ) {
			$hash = get_post_meta( $existing->ID, '_us24_import_hash', true );
			if ( empty( $args['force'] ) && $hash && md5( $existing->post_content ) !== $hash ) {
				$row['action'] = 'kept';
				$row['note']   = __( 'Edited after the last import, so it was left alone. Use "force" to overwrite.', 'us24-site' );
				return $row;
			}
			$action = 'updated';
		} elseif ( ! empty( $args['replace'] ) || us24_site_is_wp_placeholder( $existing ) ) {
			us24_site_backup( $existing );
			$action = 'replaced';
		} else {
			$row['action'] = 'skipped';
			$row['note']   = __( 'A page with this URL already exists. Tick "Replace existing pages" to take it over (the original is backed up).', 'us24-site' );
			return $row;
		}
		$data['ID'] = $existing->ID;
		if ( 'replaced' === $action || 'updated' === $action ) {
			unset( $data['post_name'] ); // Keep the existing URL exactly as it is.
		}
	}

	$id = wp_insert_post( wp_slash( $data ), true );
	if ( is_wp_error( $id ) ) {
		$row['action'] = 'error';
		$row['note']   = $id->get_error_message();
		return $row;
	}

	if ( 'page' === $type ) {
		update_post_meta( $id, '_wp_page_template', $item['template'] ?? 'canvas' );
	}
	if ( 'replaced' === $action ) {
		// Elementor renders its own data while this flag is set; the backup keeps it for undo.
		delete_post_meta( $id, '_elementor_edit_mode' );
		delete_post_meta( $id, '_elementor_template_type' );
	}
	update_post_meta( $id, '_us24_import_key', $item['key'] );
	update_post_meta( $id, '_us24_import_hash', md5( get_post_field( 'post_content', $id, 'raw' ) ) );
	if ( ! empty( $item['notes'] ) ) {
		update_post_meta( $id, '_us24_notes', array_values( (array) $item['notes'] ) );
	} else {
		delete_post_meta( $id, '_us24_notes' );
	}
	if ( ! empty( $item['description'] ) ) {
		update_post_meta( $id, '_us24_description', $item['description'] );
		// Fill SEO plugin fields only when empty, so existing tuned descriptions survive.
		if ( defined( 'RANK_MATH_VERSION' ) && ! get_post_meta( $id, 'rank_math_description', true ) ) {
			update_post_meta( $id, 'rank_math_description', $item['description'] );
		}
		if ( defined( 'WPSEO_VERSION' ) && ! get_post_meta( $id, '_yoast_wpseo_metadesc', true ) ) {
			update_post_meta( $id, '_yoast_wpseo_metadesc', $item['description'] );
		}
	}

	$row['action'] = $action;
	$row['id']     = $id;
	$row['note']   = implode( ' ', (array) ( $item['notes'] ?? array() ) );
	return $row;
}

/**
 * WordPress's own unpublished Privacy Policy draft, created on every install. Safe to take over (still backed up).
 *
 * @param WP_Post $post Existing post.
 * @return bool
 */
function us24_site_is_wp_placeholder( WP_Post $post ) {
	return 'page' === $post->post_type
		&& 'draft' === $post->post_status
		&& (int) get_option( 'wp_page_for_privacy_policy' ) === $post->ID;
}

/**
 * The item this plugin imported under a key, in any status except trash.
 *
 * @param string $key  Import key.
 * @param string $type Post type.
 * @return WP_Post|null
 */
function us24_site_find_imported( $key, $type ) {
	$found = get_posts(
		array(
			'post_type'        => $type,
			'post_status'      => array( 'publish', 'draft', 'pending', 'private', 'future' ),
			'meta_key'         => '_us24_import_key', // phpcs:ignore WordPress.DB.SlowDBQuery -- admin-only, a few dozen rows.
			'meta_value'       => $key,               // phpcs:ignore WordPress.DB.SlowDBQuery
			'numberposts'      => 1,
			'suppress_filters' => true,
		)
	);
	return $found ? $found[0] : null;
}

/**
 * Save the original state of a page before taking it over. Only the first backup is kept,
 * so re-running the import never overwrites the real original.
 *
 * @param WP_Post $post Existing post.
 */
function us24_site_backup( WP_Post $post ) {
	if ( get_post_meta( $post->ID, '_us24_backup', true ) ) {
		return;
	}
	$meta = array();
	foreach ( array( '_wp_page_template', '_elementor_edit_mode', '_elementor_template_type' ) as $k ) {
		$v = get_post_meta( $post->ID, $k, true );
		if ( '' !== $v ) {
			$meta[ $k ] = $v;
		}
	}
	$backup = array(
		'post_title'   => $post->post_title,
		'post_content' => $post->post_content,
		'post_excerpt' => $post->post_excerpt,
		'post_status'  => $post->post_status,
		'menu_order'   => $post->menu_order,
		'meta'         => $meta,
	);
	add_post_meta( $post->ID, '_us24_backup', wp_slash( wp_json_encode( $backup ) ), true );
}

/**
 * Bring one bundled image into the media library (reused on later runs).
 *
 * @param string $file File name in content/media.
 * @param array  $info alt, title, caption.
 * @return array{id:int,url:string,action:string}|WP_Error
 */
function us24_site_import_media( $file, $info ) {
	$found = get_posts(
		array(
			'post_type'   => 'attachment',
			'post_status' => 'inherit',
			'meta_key'    => '_us24_media_key', // phpcs:ignore WordPress.DB.SlowDBQuery
			'meta_value'  => $file,            // phpcs:ignore WordPress.DB.SlowDBQuery
			'numberposts' => 1,
			'fields'      => 'ids',
		)
	);
	if ( $found ) {
		return array( 'id' => (int) $found[0], 'url' => wp_get_attachment_url( $found[0] ), 'action' => 'reused' );
	}
	$path = US24_SITE_DIR . 'content/media/' . basename( $file );
	if ( ! is_readable( $path ) ) {
		return new WP_Error( 'us24_media', 'missing file ' . $file );
	}
	require_once ABSPATH . 'wp-admin/includes/image.php';
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';

	$upload = wp_upload_bits( basename( $file ), null, (string) file_get_contents( $path ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
	if ( ! empty( $upload['error'] ) ) {
		return new WP_Error( 'us24_media', $upload['error'] );
	}
	$type = wp_check_filetype( $upload['file'] );
	$id   = wp_insert_attachment(
		array(
			'post_mime_type' => $type['type'],
			'post_title'     => $info['title'] ?? pathinfo( $file, PATHINFO_FILENAME ),
			'post_excerpt'   => $info['caption'] ?? '',
			'post_content'   => '',
			'post_status'    => 'inherit',
		),
		$upload['file'],
		0,
		true
	);
	if ( is_wp_error( $id ) ) {
		return $id;
	}
	wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $upload['file'] ) );
	update_post_meta( $id, '_wp_attachment_image_alt', $info['alt'] ?? '' );
	update_post_meta( $id, '_us24_media_key', $file );
	return array( 'id' => (int) $id, 'url' => wp_get_attachment_url( $id ), 'action' => 'created' );
}

/**
 * Front page, posts page, permalinks and site identity. The previous values are saved once for undo.
 *
 * @param array $pkg  Package.
 * @param array $ids  slug => post ID.
 * @param array $args Import arguments.
 * @return string[] What changed.
 */
function us24_site_apply_settings( $pkg, $ids, $args ) {
	$keys = array( 'show_on_front', 'page_on_front', 'page_for_posts', 'permalink_structure', 'blogname', 'blogdescription' );
	if ( false === get_option( 'us24_site_prev' ) ) {
		$prev = array();
		foreach ( $keys as $k ) {
			$prev[ $k ] = get_option( $k );
		}
		add_option( 'us24_site_prev', $prev, '', false );
	}
	$done  = array();
	$front = '';
	$blog  = '';
	foreach ( $pkg['items'] as $item ) {
		if ( ! empty( $item['front'] ) ) {
			$front = $item['slug'];
		}
		if ( ! empty( $item['posts_page'] ) ) {
			$blog = $item['slug'];
		}
	}
	if ( ! empty( $args['reading'] ) && $front && ! empty( $ids[ $front ] ) ) {
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', (int) $ids[ $front ] );
		$done[] = 'front page';
		if ( $blog && ! empty( $ids[ $blog ] ) ) {
			update_option( 'page_for_posts', (int) $ids[ $blog ] );
			$done[] = 'posts page';
		}
	}
	if ( ! empty( $args['permalinks'] ) && '/%postname%/' !== get_option( 'permalink_structure' ) ) {
		global $wp_rewrite;
		$wp_rewrite->set_permalink_structure( '/%postname%/' );
		flush_rewrite_rules( false );
		$done[] = 'permalinks';
	}
	if ( ! empty( $args['identity'] ) ) {
		if ( in_array( get_option( 'blogname' ), array( '', 'WordPress', 'My WordPress Website', 'My WordPress Site', 'My Blog' ), true ) ) {
			update_option( 'blogname', 'US24 Solutions' );
			$done[] = 'site title';
		}
		if ( in_array( get_option( 'blogdescription' ), array( '', 'Just another WordPress site' ), true ) ) {
			update_option( 'blogdescription', 'Innovative Technology Driven' );
			$done[] = 'tagline';
		}
	}
	return $done;
}

/**
 * Undo the import: restore taken-over pages, trash created items, restore the saved settings.
 * Imported media stays in the library (other content may use it).
 *
 * @return array{restored:int,trashed:int,settings:bool}
 */
function us24_site_undo() {
	$ids      = get_posts(
		array(
			'post_type'   => array( 'page', 'post', 'wp_block' ),
			'post_status' => 'any',
			'meta_key'    => '_us24_import_key', // phpcs:ignore WordPress.DB.SlowDBQuery
			'numberposts' => -1,
			'fields'      => 'ids',
		)
	);
	$restored = 0;
	$trashed  = 0;
	kses_remove_filters();
	foreach ( $ids as $id ) {
		$backup = get_post_meta( $id, '_us24_backup', true );
		$b      = $backup ? json_decode( $backup, true ) : null;
		if ( is_array( $b ) ) {
			wp_update_post(
				wp_slash(
					array(
						'ID'           => $id,
						'post_title'   => $b['post_title'],
						'post_content' => $b['post_content'],
						'post_excerpt' => $b['post_excerpt'],
						'post_status'  => $b['post_status'],
						'menu_order'   => $b['menu_order'],
					)
				)
			);
			delete_post_meta( $id, '_wp_page_template' );
			foreach ( (array) $b['meta'] as $k => $v ) {
				update_post_meta( $id, $k, $v );
			}
			foreach ( array( '_us24_backup', '_us24_import_key', '_us24_import_hash', '_us24_notes', '_us24_description' ) as $k ) {
				delete_post_meta( $id, $k );
			}
			++$restored;
		} else {
			wp_trash_post( $id );
			++$trashed;
		}
	}
	kses_init();

	$prev = get_option( 'us24_site_prev' );
	if ( is_array( $prev ) ) {
		foreach ( $prev as $k => $v ) {
			if ( 'permalink_structure' === $k ) {
				global $wp_rewrite;
				$wp_rewrite->set_permalink_structure( (string) $v );
				flush_rewrite_rules( false );
				continue;
			}
			update_option( $k, $v );
		}
		delete_option( 'us24_site_prev' );
	}
	delete_option( 'us24_site_import' );
	return array( 'restored' => $restored, 'trashed' => $trashed, 'settings' => is_array( $prev ) );
}

/**
 * Package items that would collide with existing pages this plugin does not own.
 *
 * @return string[] Slugs.
 */
function us24_site_conflicts() {
	$out = array();
	foreach ( us24_site_package()['items'] as $item ) {
		$p = get_page_by_path( $item['slug'], OBJECT, $item['type'] ?? 'page' );
		if ( $p && ! get_post_meta( $p->ID, '_us24_import_key', true ) ) {
			$out[] = $item['slug'];
		}
	}
	return $out;
}
