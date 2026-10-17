<?php
/**
 * Title: Site header
 * Slug: us24/header
 * Categories: header
 * Block Types: core/template-part/header
 * Inserter: no
 *
 * Sticky glass header: logo, mega-menu navigation and the free-trial button.
 * Links are built with home_url() so the theme also works in a subdirectory install.
 *
 * @package US24
 */

$u        = static function ( $slug ) {
	return esc_url( home_url( $slug ? '/' . $slug . '/' : '/' ) );
};
$contact  = us24_contact_settings();
$services = array(
	array( 'revenue-cycle-management', 'Revenue Cycle Management', 'Billing, coding, credentialing and A/R' ),
	array( 'cyber-security-solutions', 'Cyber Security', 'SOC, VAPT, endpoint and cloud security' ),
	array( 'salesforce-crm', 'Salesforce CRM', 'Admin, apps, integration and migration' ),
	array( 'salesforce-cloud', 'Salesforce Cloud', 'Sales, Service, Health and industry clouds' ),
	array( 'web-app-development', 'Web & App Development', 'WordPress, PHP, Java, Python, React, mobile' ),
	array( 'devops', 'DevOps', 'CI/CD, automation and infrastructure monitoring' ),
	array( 'accounting-payroll', 'Accounting & Payroll', 'Bookkeeping, payables and payroll' ),
	array( 'digital-marketing', 'Digital Marketing', 'Websites, SEO and paid ads' ),
	array( 'laptop-repair-software-services', 'Laptop Repair & Software', 'Repairs, upgrades and IT support' ),
);
$rcm      = array(
	array( 'end-to-end-revenue-cycle-management-services', 'End-to-End RCM' ),
	array( 'provider-enrollment-credentialing-services', 'Enrollment & Credentialing' ),
	array( 'eligibility-verification-prior-authorization', 'Eligibility & Prior Authorization' ),
	array( 'medical-coding-services', 'Medical Coding' ),
	array( 'medical-transcription-services', 'Medical Transcription' ),
	array( 'charge-entry-submission', 'Charge Entry & Submission' ),
	array( 'payment-posting', 'Payment Posting' ),
	array( 'accounts-receivable-services', 'Accounts Receivable' ),
	array( 'denial-management', 'Denial Management' ),
	array( 'patient-billing-services', 'Patient Billing' ),
);
$company  = array(
	array( 'about', 'About' ),
	array( 'career', 'Careers' ),
	array( 'csr', 'CSR' ),
	array( 'blogs', 'Blog' ),
	array( 'contact', 'Contact' ),
);
$link     = static function ( $slug, $label, $desc = '' ) use ( $u ) {
	$attrs = array(
		'label' => $label,
		'url'   => html_entity_decode( $u( $slug ) ),
		'kind'  => 'custom',
	);
	if ( $desc ) {
		$attrs['description'] = $desc;
	}
	return '<!-- wp:navigation-link ' . wp_json_encode( $attrs, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ' /-->';
};
?>
<!-- wp:group {"className":"us24-header","layout":{"type":"constrained"}} -->
<div class="wp-block-group us24-header"><!-- wp:group {"align":"wide","className":"us24-header__bar","layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between"}} -->
<div class="wp-block-group alignwide us24-header__bar"><!-- wp:html -->
<a class="us24-logo" href="<?php echo $u( '' ); ?>" rel="home"><img src="<?php echo esc_url( get_theme_file_uri( 'assets/brand/us24-logo-light.svg' ) ); ?>" alt="US24 Solutions — Innovative Technology Driven" width="176" height="27"></a>
<!-- /wp:html -->

<!-- wp:navigation {"overlayBackgroundColor":"bg","overlayTextColor":"fg","className":"us24-nav","layout":{"type":"flex","justifyContent":"right","flexWrap":"nowrap"}} -->
<!-- wp:navigation-submenu {"label":"Services","url":"<?php echo html_entity_decode( $u( 'our-services' ) ); ?>","kind":"custom","className":"us24-mega"} -->
<?php
foreach ( $services as $s ) {
	echo $link( $s[0], $s[1], $s[2] ) . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput -- block markup, attributes JSON-encoded above.
}
?>
<!-- /wp:navigation-submenu -->

<!-- wp:navigation-submenu {"label":"Revenue Cycle","url":"<?php echo html_entity_decode( $u( 'revenue-cycle-management' ) ); ?>","kind":"custom","className":"us24-drop"} -->
<?php
foreach ( $rcm as $s ) {
	echo $link( $s[0], $s[1] ) . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput
}
?>
<!-- /wp:navigation-submenu -->

<!-- wp:navigation-submenu {"label":"Company","url":"<?php echo html_entity_decode( $u( 'about' ) ); ?>","kind":"custom","className":"us24-drop"} -->
<?php
foreach ( $company as $s ) {
	echo $link( $s[0], $s[1] ) . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput
}
?>
<!-- /wp:navigation-submenu -->
<!-- /wp:navigation -->

<!-- wp:html -->
<div class="us24-header__actions"><a class="us24-header__phone" href="<?php echo esc_url( us24_tel( $contact['phone'] ) ); ?>"><?php echo esc_html( $contact['phone'] ); ?></a><a class="us24-header__cta wp-element-button" href="<?php echo $u( 'contact' ); ?>">Free trial</a></div>
<!-- /wp:html --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->
