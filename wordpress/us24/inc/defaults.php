<?php
/**
 * Contact details used by the header and footer.
 *
 * The "US24 Site" plugin owns these (Settings → US24 Site) so there is one place to change a phone number.
 * The values below are only a fallback for when the plugin is not active. They match the live Contact page
 * as of 2026-02-25, which is the most recently updated source on us24solutions.com.
 *
 * @package US24
 */

defined( 'ABSPATH' ) || exit;

/**
 * All contact settings, from the plugin when available.
 *
 * @return array{email:string,careers_email:string,phone:string,offices:array<int,array{label:string,address:string,phone:string,email:string}>,social:array<string,string>}
 */
function us24_contact_settings() {
	if ( function_exists( 'us24_site_settings' ) ) {
		return us24_site_settings();
	}
	return array(
		'email'         => 'info@us24solutions.com',
		'careers_email' => 'hr@us24solutions.com',
		'phone'         => '+1 315-979-5075',
		'offices'       => array(
			array(
				'label'   => 'USA Headquarters',
				'address' => "575 W Madison St\nChicago, IL 60661, USA",
				'phone'   => '+1 315-979-5075',
				'email'   => 'info@us24solutions.com',
			),
			array(
				'label'   => 'UK Office',
				'address' => "123 Churchill Rd\nUxbridge UB10 0WL, UK",
				'phone'   => '+44 7442 003148',
				'email'   => 'info@us24solutions.com',
			),
			array(
				'label'   => 'India Office',
				'address' => "H-159, Sector 63, H Block\nNoida, Uttar Pradesh 201301, India",
				'phone'   => '+91 89206 62009',
				'email'   => 'info@us24solutions.com',
			),
		),
		'social'        => array(
			'facebook' => 'https://www.facebook.com/US24solutionshealthcare',
			'x'        => 'https://twitter.com/us24solutions',
			'linkedin' => 'https://www.linkedin.com/company/us24-solutions-pvt-ltd/',
		),
	);
}

/**
 * A phone number as a tel: URL.
 *
 * @param string $phone Display number.
 * @return string
 */
function us24_tel( $phone ) {
	return 'tel:' . preg_replace( '/[^0-9+]/', '', $phone );
}
