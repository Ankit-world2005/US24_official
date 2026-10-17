<?php
/**
 * Title: Site footer
 * Slug: us24/footer
 * Categories: footer
 * Block Types: core/template-part/footer
 * Inserter: no
 *
 * "Ready to talk?" band, link columns, the three offices and the legal bar.
 * Office details come from Settings → US24 Site (plugin) so they are never out of sync.
 *
 * @package US24
 */

$u       = static function ( $slug ) {
	return esc_url( home_url( $slug ? '/' . $slug . '/' : '/' ) );
};
$c       = us24_contact_settings();
$columns = array(
	'Services'      => array(
		'revenue-cycle-management'        => 'Revenue Cycle Management',
		'cyber-security-solutions'        => 'Cyber Security',
		'salesforce-crm'                  => 'Salesforce CRM',
		'salesforce-cloud'                => 'Salesforce Cloud',
		'web-app-development'             => 'Web & App Development',
		'devops'                          => 'DevOps',
		'accounting-payroll'              => 'Accounting & Payroll',
		'digital-marketing'               => 'Digital Marketing',
		'laptop-repair-software-services' => 'Laptop Repair & Software',
	),
	'Revenue cycle' => array(
		'end-to-end-revenue-cycle-management-services' => 'End-to-End RCM',
		'provider-enrollment-credentialing-services'   => 'Enrollment & Credentialing',
		'eligibility-verification-prior-authorization' => 'Eligibility & Prior Auth',
		'medical-coding-services'                      => 'Medical Coding',
		'accounts-receivable-services'                 => 'Accounts Receivable',
		'denial-management'                            => 'Denial Management',
	),
	'Company'       => array(
		'about'       => 'About',
		'career'      => 'Careers',
		'csr'         => 'CSR',
		'blogs'       => 'Blog',
		'contact'     => 'Contact',
		'our-services' => 'All services',
	),
);
$social_labels = array(
	'facebook' => 'Facebook',
	'x'        => 'X (Twitter)',
	'linkedin' => 'LinkedIn',
);
?>
<!-- wp:group {"className":"us24-footer","layout":{"type":"constrained"}} -->
<div class="wp-block-group us24-footer"><!-- wp:group {"align":"wide","className":"us24-footer__cta","layout":{"type":"flex","flexWrap":"wrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide us24-footer__cta"><!-- wp:group {"className":"us24-footer__cta-text","layout":{"type":"default"}} -->
<div class="wp-block-group us24-footer__cta-text"><!-- wp:paragraph {"className":"is-style-us24-eyebrow"} -->
<p class="is-style-us24-eyebrow">Ready to talk?</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2} -->
<h2 class="wp-block-heading">Streamline how you do business. Improve how you get paid.</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Solutions that give a better experience from start to finish, with a risk-free 30–90 day trial and no long-term contract.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="<?php echo $u( 'contact' ); ?>">Get a free trial</a></div>
<!-- /wp:button -->

<!-- wp:button {"className":"is-style-outline"} -->
<div class="wp-block-button is-style-outline"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url( us24_tel( $c['phone'] ) ); ?>">Call <?php echo esc_html( $c['phone'] ); ?></a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group -->

<!-- wp:html -->
<div class="us24-footer__grid alignwide">
	<div class="us24-footer__brand">
		<a class="us24-logo" href="<?php echo $u( '' ); ?>" rel="home"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/brand/us24-logo-light.svg' ) ); ?>" alt="US24 Solutions — Innovative Technology Driven" width="200" height="31" loading="lazy"></a>
		<p>RCM, IT services and consulting for healthcare providers and growing businesses.</p>
		<ul class="us24-footer__badges"><li>ISO 9001:2015</li><li>HIPAA compliant</li></ul>
	</div>
	<?php foreach ( $columns as $heading => $links ) : ?>
	<nav class="us24-footer__col" aria-label="<?php echo esc_attr( $heading ); ?>">
		<h2><?php echo esc_html( $heading ); ?></h2>
		<ul>
			<?php foreach ( $links as $slug => $label ) : ?>
			<li><a href="<?php echo $u( $slug ); ?>"><?php echo esc_html( $label ); ?></a></li>
			<?php endforeach; ?>
		</ul>
	</nav>
	<?php endforeach; ?>
</div>
<div class="us24-footer__offices alignwide">
	<?php foreach ( $c['offices'] as $o ) : ?>
	<div class="us24-office">
		<h2><?php echo esc_html( $o['label'] ); ?></h2>
		<p><?php echo nl2br( esc_html( $o['address'] ) ); ?></p>
		<p><a href="<?php echo esc_url( us24_tel( $o['phone'] ) ); ?>"><?php echo esc_html( $o['phone'] ); ?></a><br><a href="mailto:<?php echo esc_attr( $o['email'] ); ?>"><?php echo esc_html( $o['email'] ); ?></a></p>
	</div>
	<?php endforeach; ?>
</div>
<div class="us24-footer__bar alignwide">
	<p>© <?php echo esc_html( wp_date( 'Y' ) ); ?> US24 Solutions. All rights reserved.</p>
	<ul class="us24-footer__legal">
		<li><a href="<?php echo $u( 'legal' ); ?>">Legal</a></li>
		<li><a href="<?php echo $u( 'privacy-policy' ); ?>">Privacy</a></li>
		<li><a href="<?php echo $u( 'terms-conditions' ); ?>">Terms &amp; Conditions</a></li>
	</ul>
	<ul class="us24-footer__social">
		<?php foreach ( $c['social'] as $network => $url ) : ?>
			<?php if ( $url ) : ?>
		<li><a href="<?php echo esc_url( $url ); ?>" rel="noopener" target="_blank"><?php echo esc_html( $social_labels[ $network ] ?? ucfirst( $network ) ); ?></a></li>
			<?php endif; ?>
		<?php endforeach; ?>
	</ul>
</div>
<!-- /wp:html --></div>
<!-- /wp:group -->
