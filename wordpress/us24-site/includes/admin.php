<?php
/**
 * Tools → US24 Import screen, the "Review" column on Pages, and the post-activation notice.
 *
 * @package US24_Site
 */

defined( 'ABSPATH' ) || exit;

/**
 * Menu entry.
 */
function us24_site_import_menu() {
	add_management_page( __( 'US24 Import', 'us24-site' ), __( 'US24 Import', 'us24-site' ), 'manage_options', 'us24-import', 'us24_site_import_page' );
}
add_action( 'admin_menu', 'us24_site_import_menu' );

/**
 * Handle the import / undo buttons (POST + nonce + capability), then redirect to show the result.
 */
function us24_site_import_actions() {
	if ( ! isset( $_POST['us24_import_action'] ) || ! current_user_can( 'manage_options' ) ) {
		return;
	}
	check_admin_referer( 'us24_import' );
	$action = sanitize_key( wp_unslash( $_POST['us24_import_action'] ) );
	if ( 'import' === $action ) {
		us24_site_import(
			array(
				'replace'    => ! empty( $_POST['us24_replace'] ),
				'force'      => ! empty( $_POST['us24_force'] ),
				'reading'    => ! empty( $_POST['us24_reading'] ),
				'permalinks' => ! empty( $_POST['us24_permalinks'] ),
				'identity'   => ! empty( $_POST['us24_identity'] ),
			)
		);
		$done = 'imported';
	} elseif ( 'undo' === $action ) {
		$r = us24_site_undo();
		set_transient( 'us24_site_undo_result', $r, MINUTE_IN_SECONDS * 5 );
		$done = 'undone';
	} else {
		return;
	}
	wp_safe_redirect( add_query_arg( array( 'page' => 'us24-import', 'done' => $done ), admin_url( 'tools.php' ) ) );
	exit;
}
add_action( 'admin_init', 'us24_site_import_actions' );

/**
 * The import screen.
 */
function us24_site_import_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$pkg       = us24_site_package();
	$last      = get_option( 'us24_site_import' );
	$conflicts = us24_site_conflicts();
	$done      = isset( $_GET['done'] ) ? sanitize_key( wp_unslash( $_GET['done'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display only.
	$pages     = count( array_filter( $pkg['items'], static fn( $i ) => 'page' === ( $i['type'] ?? 'page' ) ) );
	$posts     = count( $pkg['items'] ) - $pages;
	$theme_ok  = 'us24' === get_stylesheet() || 'us24' === get_template();
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'US24 Import', 'us24-site' ); ?></h1>
		<p>
			<?php
			echo esc_html(
				sprintf(
					/* translators: 1: page count, 2: post count, 3: image count, 4: source, 5: date */
					__( 'This package rebuilds %1$d pages and %2$d post from %4$s as editable blocks, with %3$d images. Snapshot taken %5$s.', 'us24-site' ),
					$pages,
					$posts,
					count( $pkg['media'] ),
					$pkg['source'] ?: 'us24solutions.com',
					$pkg['generated'] ?: '—'
				)
			);
			?>
		</p>
		<?php if ( ! $theme_ok ) : ?>
			<div class="notice notice-warning inline"><p><?php esc_html_e( 'Activate the US24 theme first. The pages use its "Canvas" template, 3D hero block and styles.', 'us24-site' ); ?></p></div>
		<?php endif; ?>
		<?php if ( 'imported' === $done ) : ?>
			<div class="notice notice-success inline"><p><?php esc_html_e( 'Import finished. The results are below.', 'us24-site' ); ?></p></div>
		<?php elseif ( 'undone' === $done ) : ?>
			<?php $u = get_transient( 'us24_site_undo_result' ); ?>
			<div class="notice notice-success inline"><p>
				<?php
				echo esc_html(
					sprintf(
						/* translators: 1: restored count, 2: trashed count */
						__( 'Undo finished: %1$d original pages restored, %2$d imported items moved to the trash. Reading and permalink settings were put back.', 'us24-site' ),
						(int) ( $u['restored'] ?? 0 ),
						(int) ( $u['trashed'] ?? 0 )
					)
				);
				?>
			</p></div>
		<?php endif; ?>

		<form method="post">
			<?php wp_nonce_field( 'us24_import' ); ?>
			<h2><?php esc_html_e( 'Options', 'us24-site' ); ?></h2>
			<?php if ( $conflicts ) : ?>
				<p><strong>
				<?php
				echo esc_html(
					sprintf(
						/* translators: %d: number of pages */
						_n( '%d page on this site already uses one of these URLs.', '%d pages on this site already use these URLs.', count( $conflicts ), 'us24-site' ),
						count( $conflicts )
					)
				);
				?>
				</strong> <?php esc_html_e( 'They are skipped unless you tick the first box.', 'us24-site' ); ?></p>
			<?php endif; ?>
			<fieldset>
				<p><label><input type="checkbox" name="us24_replace" value="1"> <?php esc_html_e( 'Replace existing pages that have the same URL. Each original (content, template and Elementor setting) is backed up and comes back with "Undo import".', 'us24-site' ); ?></label></p>
				<p><label><input type="checkbox" name="us24_force" value="1"> <?php esc_html_e( 'Overwrite imported pages even if someone edited them since the last import.', 'us24-site' ); ?></label></p>
				<p><label><input type="checkbox" name="us24_reading" value="1" checked> <?php esc_html_e( 'Use Home as the front page and Blog as the posts page.', 'us24-site' ); ?></label></p>
				<p><label><input type="checkbox" name="us24_permalinks" value="1" <?php checked( '/%postname%/' !== get_option( 'permalink_structure' ) ); ?>> <?php esc_html_e( 'Use "Post name" permalinks (/page-name/) so every URL matches the live site.', 'us24-site' ); ?></label></p>
				<p><label><input type="checkbox" name="us24_identity" value="1" checked> <?php esc_html_e( 'Set the site title and tagline, if they are still the WordPress defaults.', 'us24-site' ); ?></label></p>
			</fieldset>
			<p>
				<button type="submit" name="us24_import_action" value="import" class="button button-primary"><?php esc_html_e( 'Import pages', 'us24-site' ); ?></button>
				<?php if ( $last ) : ?>
					<button type="submit" name="us24_import_action" value="undo" class="button" onclick="return confirm('<?php echo esc_js( __( 'Restore the original pages and settings, and move the imported pages to the trash?', 'us24-site' ) ); ?>');"><?php esc_html_e( 'Undo import', 'us24-site' ); ?></button>
				<?php endif; ?>
			</p>
		</form>

		<?php if ( $last && ! empty( $last['report']['items'] ) ) : ?>
			<h2>
				<?php
				echo esc_html(
					sprintf(
						/* translators: %s: date and time */
						__( 'Last import: %s', 'us24-site' ),
						wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), (int) $last['time'] )
					)
				);
				?>
			</h2>
			<?php
			$counts = array_count_values( wp_list_pluck( $last['report']['items'], 'action' ) );
			echo '<p>' . esc_html( implode( ' · ', array_map( static fn( $k, $v ) => $v . ' ' . $k, array_keys( $counts ), $counts ) ) );
			if ( ! empty( $last['report']['settings'] ) ) {
				echo esc_html( ' · ' . __( 'Changed settings:', 'us24-site' ) . ' ' . implode( ', ', $last['report']['settings'] ) );
			}
			echo '</p>';
			?>
			<table class="widefat striped">
				<thead><tr><th><?php esc_html_e( 'Page', 'us24-site' ); ?></th><th><?php esc_html_e( 'Result', 'us24-site' ); ?></th><th><?php esc_html_e( 'Review notes', 'us24-site' ); ?></th></tr></thead>
				<tbody>
				<?php foreach ( $last['report']['items'] as $row ) : ?>
					<tr>
						<td>
							<strong><?php echo esc_html( $row['title'] ); ?></strong><br>
							<code>/<?php echo esc_html( $row['slug'] ); ?>/</code>
							<?php if ( ! empty( $row['id'] ) && get_post( $row['id'] ) ) : ?>
								· <a href="<?php echo esc_url( get_permalink( $row['id'] ) ); ?>"><?php esc_html_e( 'View', 'us24-site' ); ?></a>
								· <a href="<?php echo esc_url( get_edit_post_link( $row['id'] ) ); ?>"><?php esc_html_e( 'Edit', 'us24-site' ); ?></a>
							<?php endif; ?>
						</td>
						<td><?php echo esc_html( $row['action'] ); ?></td>
						<td><?php echo esc_html( $row['note'] ); ?></td>
					</tr>
				<?php endforeach; ?>
				</tbody>
			</table>
		<?php endif; ?>
	</div>
	<?php
}

/**
 * "Review" column on the Pages and Posts lists, from the importer's notes.
 *
 * @param string[] $cols Columns.
 * @return string[]
 */
function us24_site_review_column( $cols ) {
	$cols['us24_review'] = __( 'Review', 'us24-site' );
	return $cols;
}
add_filter( 'manage_pages_columns', 'us24_site_review_column' );
add_filter( 'manage_posts_columns', 'us24_site_review_column' );

/**
 * Column content.
 *
 * @param string $col Column key.
 * @param int    $id  Post ID.
 */
function us24_site_review_column_content( $col, $id ) {
	if ( 'us24_review' !== $col ) {
		return;
	}
	$notes = (array) get_post_meta( $id, '_us24_notes', true );
	$notes = array_filter( $notes );
	if ( $notes ) {
		echo '<span title="' . esc_attr( implode( "\n", $notes ) ) . '">⚑ ' . esc_html( wp_trim_words( implode( ' ', $notes ), 14 ) ) . '</span>';
	}
}
add_action( 'manage_pages_custom_column', 'us24_site_review_column_content', 10, 2 );
add_action( 'manage_posts_custom_column', 'us24_site_review_column_content', 10, 2 );

/**
 * Point to the importer right after activation.
 */
function us24_site_activate() {
	set_transient( 'us24_site_activated', 1, MINUTE_IN_SECONDS * 10 );
}
register_activation_hook( US24_SITE_FILE, 'us24_site_activate' );

/**
 * The notice.
 */
function us24_site_activation_notice() {
	if ( ! get_transient( 'us24_site_activated' ) || ! current_user_can( 'manage_options' ) || get_option( 'us24_site_import' ) ) {
		return;
	}
	delete_transient( 'us24_site_activated' );
	printf(
		'<div class="notice notice-info is-dismissible"><p>%s <a href="%s">%s</a></p></div>',
		esc_html__( 'US24 Site is active. Next, import the pages:', 'us24-site' ),
		esc_url( admin_url( 'tools.php?page=us24-import' ) ),
		esc_html__( 'Tools → US24 Import', 'us24-site' )
	);
}
add_action( 'admin_notices', 'us24_site_activation_notice' );
