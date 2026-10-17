<?php
/**
 * Minimal SEO output for imported pages when no SEO plugin is active.
 *
 * Every imported page carries a description in `_us24_description`. With Rank Math or Yoast active the
 * importer copies it into their fields instead, and this file outputs nothing.
 *
 * @package US24_Site
 */

defined( 'ABSPATH' ) || exit;

/**
 * True when an SEO plugin that writes its own meta tags is active.
 *
 * @return bool
 */
function us24_site_has_seo_plugin() {
	return defined( 'RANK_MATH_VERSION' ) || defined( 'WPSEO_VERSION' ) || defined( 'AIOSEO_VERSION' ) || defined( 'SEOPRESS_VERSION' );
}

/**
 * Description, Open Graph and Twitter tags.
 */
function us24_site_meta_tags() {
	if ( us24_site_has_seo_plugin() || ! is_singular() ) {
		return;
	}
	$post = get_queried_object();
	if ( ! $post instanceof WP_Post ) {
		return;
	}
	$desc = (string) get_post_meta( $post->ID, '_us24_description', true );
	if ( '' === $desc ) {
		$desc = has_excerpt( $post ) ? get_the_excerpt( $post ) : wp_trim_words( wp_strip_all_tags( strip_shortcodes( $post->post_content ) ), 28, '…' );
	}
	$desc  = trim( preg_replace( '/\s+/', ' ', $desc ) );
	$title = wp_get_document_title();
	$url   = get_permalink( $post );
	$image = get_the_post_thumbnail_url( $post, 'large' );
	if ( ! $image && file_exists( get_theme_file_path( 'assets/brand/og-image.jpg' ) ) ) {
		$image = get_theme_file_uri( 'assets/brand/og-image.jpg' ); // Shipped by the US24 theme.
	}
	$tags = array(
		array( 'name', 'description', $desc ),
		array( 'property', 'og:type', is_front_page() ? 'website' : 'article' ),
		array( 'property', 'og:site_name', get_bloginfo( 'name' ) ),
		array( 'property', 'og:title', $title ),
		array( 'property', 'og:description', $desc ),
		array( 'property', 'og:url', $url ),
		array( 'property', 'og:image', $image ),
		array( 'name', 'twitter:card', 'summary_large_image' ),
	);
	foreach ( $tags as $t ) {
		if ( $t[2] ) {
			printf( '<meta %s="%s" content="%s">' . "\n", esc_attr( $t[0] ), esc_attr( $t[1] ), esc_attr( $t[2] ) );
		}
	}
}
add_action( 'wp_head', 'us24_site_meta_tags', 5 );

/**
 * "Page | US24 Solutions", matching the live site's title format.
 *
 * @return string
 */
function us24_site_title_separator() {
	return '|';
}
add_filter( 'document_title_separator', 'us24_site_title_separator' );
