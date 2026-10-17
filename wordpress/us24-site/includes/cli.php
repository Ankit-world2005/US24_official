<?php
/**
 * WP-CLI: `wp us24 import`, `wp us24 undo`, `wp us24 status`.
 *
 * @package US24_Site
 */

defined( 'ABSPATH' ) || exit;

/**
 * Import the US24 Solutions pages from the bundled content package.
 */
class US24_Site_CLI {

	/**
	 * Create or update the pages, post, synced patterns and media.
	 *
	 * ## OPTIONS
	 *
	 * [--replace]
	 * : Take over existing pages with the same URL (each original is backed up for `wp us24 undo`).
	 *
	 * [--force]
	 * : Overwrite imported pages even if they were edited since the last import.
	 *
	 * [--no-reading]
	 * : Do not set the front page and posts page.
	 *
	 * [--no-permalinks]
	 * : Do not switch to /%postname%/ permalinks.
	 *
	 * [--no-identity]
	 * : Do not set the site title and tagline.
	 *
	 * ## EXAMPLES
	 *
	 *     wp us24 import
	 *     wp us24 import --replace
	 *
	 * @param array $args       Positional.
	 * @param array $assoc_args Flags.
	 */
	public function import( $args, $assoc_args ) {
		$report = us24_site_import(
			array(
				'replace'    => (bool) \WP_CLI\Utils\get_flag_value( $assoc_args, 'replace', false ),
				'force'      => (bool) \WP_CLI\Utils\get_flag_value( $assoc_args, 'force', false ),
				'reading'    => (bool) \WP_CLI\Utils\get_flag_value( $assoc_args, 'reading', true ),
				'permalinks' => (bool) \WP_CLI\Utils\get_flag_value( $assoc_args, 'permalinks', true ),
				'identity'   => (bool) \WP_CLI\Utils\get_flag_value( $assoc_args, 'identity', true ),
			)
		);
		\WP_CLI\Utils\format_items( 'table', $report['items'], array( 'type', 'slug', 'action', 'id', 'note' ) );
		$media = array_count_values( wp_list_pluck( $report['media'], 'action' ) );
		WP_CLI::log( 'Media: ' . wp_json_encode( $media ) . ' · Patterns: ' . count( $report['blocks'] ) . ' · Settings: ' . ( implode( ', ', $report['settings'] ) ?: 'none' ) );
		$errors = array_filter( array_merge( $report['items'], $report['media'] ), static fn( $r ) => 'error' === $r['action'] );
		if ( $errors ) {
			WP_CLI::error( count( $errors ) . ' item(s) failed.' );
		}
		WP_CLI::success( 'Import finished.' );
	}

	/**
	 * Restore taken-over pages, trash imported items and restore the previous settings.
	 *
	 * [--yes]
	 * : Skip the confirmation.
	 *
	 * @param array $args       Positional.
	 * @param array $assoc_args Flags.
	 */
	public function undo( $args, $assoc_args ) {
		WP_CLI::confirm( 'Restore the original pages and settings and trash the imported items?', $assoc_args );
		$r = us24_site_undo();
		WP_CLI::success( sprintf( '%d restored, %d trashed.', $r['restored'], $r['trashed'] ) );
	}

	/**
	 * Show the package and the last import.
	 */
	public function status() {
		$pkg  = us24_site_package();
		$last = get_option( 'us24_site_import' );
		WP_CLI::log( sprintf( 'Package %s from %s (%s): %d items, %d images, %d patterns.', $pkg['version'], $pkg['source'], $pkg['generated'], count( $pkg['items'] ), count( $pkg['media'] ), count( $pkg['blocks'] ) ) );
		WP_CLI::log( 'Conflicting existing pages: ' . ( implode( ', ', us24_site_conflicts() ) ?: 'none' ) );
		WP_CLI::log( $last ? 'Last import: ' . wp_date( 'Y-m-d H:i', (int) $last['time'] ) : 'Not imported yet.' );
	}
}

WP_CLI::add_command( 'us24', 'US24_Site_CLI' );
