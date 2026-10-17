<?php
/**
 * Plugin Name:       US24 Site
 * Plugin URI:        https://us24solutions.com/
 * Description:       Content and features for the US24 Solutions website: imports every page of us24solutions.com as editable blocks (Tools → US24 Import), contact and career forms, office details in one place (Settings → US24 Site) and SEO descriptions.
 * Version:           1.0.0
 * Requires at least: 6.6
 * Requires PHP:      8.0
 * Author:            US24 Solutions
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       us24-site
 *
 * @package US24_Site
 */

defined( 'ABSPATH' ) || exit;

define( 'US24_SITE_VERSION', '1.0.0' );
define( 'US24_SITE_FILE', __FILE__ );
define( 'US24_SITE_DIR', plugin_dir_path( __FILE__ ) );
define( 'US24_SITE_URL', plugin_dir_url( __FILE__ ) );

require_once US24_SITE_DIR . 'includes/settings.php';
require_once US24_SITE_DIR . 'includes/blocks.php';
require_once US24_SITE_DIR . 'includes/forms.php';
require_once US24_SITE_DIR . 'includes/seo.php';
require_once US24_SITE_DIR . 'includes/importer.php';
require_once US24_SITE_DIR . 'includes/admin.php';

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	require_once US24_SITE_DIR . 'includes/cli.php';
}

/**
 * Settings link on the Plugins screen.
 *
 * @param string[] $links Action links.
 * @return string[]
 */
function us24_site_action_links( $links ) {
	array_unshift(
		$links,
		'<a href="' . esc_url( admin_url( 'tools.php?page=us24-import' ) ) . '">' . esc_html__( 'Import pages', 'us24-site' ) . '</a>',
		'<a href="' . esc_url( admin_url( 'options-general.php?page=us24-site' ) ) . '">' . esc_html__( 'Settings', 'us24-site' ) . '</a>'
	);
	return $links;
}
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'us24_site_action_links' );
