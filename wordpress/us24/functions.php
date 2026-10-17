<?php
/**
 * US24 theme setup: styles, block styles, the 3D hero block and small head tweaks.
 *
 * @package US24
 */

defined( 'ABSPATH' ) || exit;

define( 'US24_THEME_VERSION', '1.0.0' );

require_once __DIR__ . '/inc/defaults.php';

/**
 * Theme supports. Block themes already get title-tag, block styles and the site editor.
 */
function us24_setup() {
	add_theme_support( 'editor-styles' );
	add_editor_style( 'assets/css/site.css' );
	add_theme_support( 'responsive-embeds' );
	remove_theme_support( 'core-block-patterns' );
}
add_action( 'after_setup_theme', 'us24_setup' );

/**
 * Front-end stylesheet.
 */
function us24_enqueue() {
	wp_enqueue_style( 'us24-site', get_theme_file_uri( 'assets/css/site.css' ), array(), US24_THEME_VERSION );
}
add_action( 'wp_enqueue_scripts', 'us24_enqueue' );

/**
 * three.js r128 (self-hosted, MIT) and the 3D hero block.
 * The vendor scripts are only enqueued on pages that contain the hero, because they are dependencies of its view script.
 */
function us24_register_blocks() {
	$vendor = get_theme_file_uri( 'assets/vendor/three/' );
	wp_register_script( 'us24-three', $vendor . 'three.min.js', array(), '0.128.0', array( 'in_footer' => true ) );
	wp_register_script( 'us24-three-addons', $vendor . 'three-addons.js', array( 'us24-three' ), '0.128.0', array( 'in_footer' => true ) );
	register_block_type( __DIR__ . '/blocks/hero-3d' );
}
add_action( 'init', 'us24_register_blocks' );

/**
 * Block style variations. Their CSS is in assets/css/site.css.
 */
function us24_register_block_styles() {
	$styles = array(
		'core/group'     => array(
			'us24-card'  => __( 'Card', 'us24' ),
			'us24-panel' => __( 'Panel', 'us24' ),
		),
		'core/paragraph' => array(
			'us24-eyebrow' => __( 'Eyebrow', 'us24' ),
			'us24-lead'    => __( 'Lead', 'us24' ),
			'us24-crumbs'  => __( 'Breadcrumbs', 'us24' ),
		),
		'core/list'      => array(
			'us24-check' => __( 'Checklist', 'us24' ),
			'us24-pills' => __( 'Pills', 'us24' ),
		),
		'core/image'     => array(
			'us24-frame'  => __( 'Framed', 'us24' ),
			'us24-light'  => __( 'Framed on white', 'us24' ),
			'us24-avatar' => __( 'Avatar', 'us24' ),
		),
		'core/quote'     => array(
			'us24-quote' => __( 'Glass', 'us24' ),
		),
	);
	foreach ( $styles as $block => $variations ) {
		foreach ( $variations as $name => $label ) {
			register_block_style( $block, array( 'name' => $name, 'label' => $label ) );
		}
	}
}
add_action( 'init', 'us24_register_block_styles' );

/**
 * Pattern category for the theme's own patterns.
 */
function us24_register_pattern_category() {
	register_block_pattern_category( 'us24', array( 'label' => __( 'US24', 'us24' ) ) );
}
add_action( 'init', 'us24_register_pattern_category' );

/**
 * Browser colour and a fallback favicon when no Site Icon is set.
 */
function us24_head() {
	echo '<meta name="theme-color" content="#EBF7FA">' . "\n";
	if ( ! has_site_icon() ) {
		echo '<link rel="icon" type="image/svg+xml" href="' . esc_url( get_theme_file_uri( 'assets/brand/favicon.svg' ) ) . '">' . "\n";
	}
}
add_action( 'wp_head', 'us24_head', 2 );

/**
 * Preload the two fonts used above the fold.
 */
function us24_preload_fonts() {
	foreach ( array( 'bricolage-grotesque.woff2', 'instrument-sans.woff2' ) as $file ) {
		printf( '<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin>' . "\n", esc_url( get_theme_file_uri( 'assets/fonts/' . $file ) ) );
	}
}
add_action( 'wp_head', 'us24_preload_fonts', 1 );
