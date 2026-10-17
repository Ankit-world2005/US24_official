<?php
/**
 * Server render for the US24 3D hero.
 *
 * The headline, text, badges, buttons and stats are plain HTML so they are indexable and still show
 * without JavaScript or WebGL. view.js adds the 3D city, hotspot labels, the info card and the tour bar.
 *
 * @package US24
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Inner content (unused).
 * @var WP_Block $block      Block instance.
 */

defined( 'ABSPATH' ) || exit;

$us24_url = static function ( $url ) {
	$url = trim( (string) $url );
	if ( '' === $url ) {
		return '';
	}
	// Root-relative paths resolve against the site, so the block works in subdirectory installs.
	if ( str_starts_with( $url, '/' ) && ! str_starts_with( $url, '//' ) ) {
		$url = home_url( $url );
	}
	return esc_url( $url );
};

$us24_show_copy = ! empty( $attributes['showCopy'] );
$us24_classes   = 'us24-hero' . ( $us24_show_copy ? '' : ' nocopy' );
$us24_wrapper   = get_block_wrapper_attributes(
	array(
		'class'               => $us24_classes,
		'aria-label'          => __( 'US24 Solutions', 'us24' ),
		'data-us24-hero'      => '',
		'data-auto-tour'      => ! empty( $attributes['autoTour'] ) ? '1' : '0',
		'data-tour-seconds'   => (string) max( 3, (int) ( $attributes['tourSeconds'] ?? 8 ) ),
		'data-home'           => esc_url( home_url( '/' ) ),
	)
);
$us24_headline  = wp_kses( (string) $attributes['headline'], array( 'br' => array(), 'em' => array(), 'strong' => array() ) );
$us24_primary   = $us24_url( $attributes['primaryUrl'] ?? '' );
$us24_secondary = $us24_url( $attributes['secondaryUrl'] ?? '' );
?>
<section <?php echo $us24_wrapper; // phpcs:ignore WordPress.Security.EscapeOutput -- escaped by get_block_wrapper_attributes(). ?>>
	<canvas class="us24-hero__gl" aria-label="<?php esc_attr_e( 'Animated 3D city showing how US24 Solutions works: physician clinics send claims to the US24 headquarters, where each floor handles one stage of the revenue cycle, then on to insurer towers, with payments flowing back. A technology annex runs the automation, and a hologram globe above the headquarters marks offices in Chicago, Uxbridge and Noida.', 'us24' ); ?>"></canvas>
	<div class="us24-hero__shade" aria-hidden="true"></div>
	<div class="us24-hero__labels"></div>

	<?php if ( $us24_show_copy ) : ?>
	<div class="us24-hero__copy">
		<div class="us24-hero__badges"><span class="us24-hero__badge"><b>ISO</b> 9001:2015</span><span class="us24-hero__badge"><b>HIPAA</b> compliant</span><span class="us24-hero__badge"><b>3</b> global delivery centres</span></div>
		<h1><?php echo $us24_headline; // phpcs:ignore WordPress.Security.EscapeOutput -- wp_kses above. ?></h1>
		<p><?php echo esc_html( $attributes['text'] ); ?></p>
		<div class="us24-hero__ctas">
			<?php if ( $us24_primary && $attributes['primaryLabel'] ) : ?>
			<a class="us24-hero__btn is-primary" href="<?php echo $us24_primary; // phpcs:ignore WordPress.Security.EscapeOutput ?>"><?php echo esc_html( $attributes['primaryLabel'] ); ?></a>
			<?php endif; ?>
			<?php if ( $us24_secondary && $attributes['secondaryLabel'] ) : ?>
			<a class="us24-hero__btn is-ghost" href="<?php echo $us24_secondary; // phpcs:ignore WordPress.Security.EscapeOutput ?>"><?php echo esc_html( $attributes['secondaryLabel'] ); ?></a>
			<?php endif; ?>
		</div>
		<dl class="us24-hero__stat">
			<div><dt>99%</dt><dd><?php esc_html_e( 'claims paid', 'us24' ); ?></dd></div>
			<div><dt>20%</dt><dd><?php esc_html_e( 'lower cost to collect, up to', 'us24' ); ?></dd></div>
			<div><dt>30–90</dt><dd><?php esc_html_e( 'day risk-free trial', 'us24' ); ?></dd></div>
		</dl>
	</div>
	<?php endif; ?>

	<aside class="us24-hero__card" aria-live="polite"></aside>

	<div class="us24-hero__dock">
		<div class="us24-hero__legend" aria-label="<?php esc_attr_e( 'Legend', 'us24' ); ?>">
			<span style="color:#7C9CFF"><i></i><?php esc_html_e( 'Claims', 'us24' ); ?></span>
			<span style="color:#F68535"><i></i><?php esc_html_e( 'Payments', 'us24' ); ?></span>
			<span style="color:#FFCF5C"><i></i><?php esc_html_e( 'Denials resubmitted', 'us24' ); ?></span>
		</div>
		<nav class="us24-hero__tour" aria-label="<?php esc_attr_e( 'Tour the model', 'us24' ); ?>"></nav>
	</div>
</section>
