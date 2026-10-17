<?php
/**
 * Settings → US24 Site: form recipients, office details and social links.
 *
 * The theme reads these through us24_site_settings(), so the header, footer, contact blocks and forms
 * all show the same phone numbers and addresses.
 *
 * @package US24_Site
 */

defined( 'ABSPATH' ) || exit;

/**
 * Defaults: the live Contact page as of 2026-02-25 (the most recently updated source on us24solutions.com).
 *
 * @return array
 */
function us24_site_defaults() {
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
 * Saved settings merged over the defaults.
 *
 * @return array
 */
function us24_site_settings() {
	$defaults = us24_site_defaults();
	$saved    = get_option( 'us24_site', array() );
	if ( ! is_array( $saved ) ) {
		return $defaults;
	}
	$out           = array_merge( $defaults, array_intersect_key( $saved, $defaults ) );
	$out['social'] = array_merge( $defaults['social'], is_array( $saved['social'] ?? null ) ? $saved['social'] : array() );
	if ( empty( $out['offices'] ) || ! is_array( $out['offices'] ) ) {
		$out['offices'] = $defaults['offices'];
	}
	return $out;
}

/**
 * Sanitize the settings form.
 *
 * @param mixed $input Raw input.
 * @return array
 */
function us24_site_sanitize_settings( $input ) {
	$input = is_array( $input ) ? $input : array();
	$out   = array(
		'email'         => sanitize_email( $input['email'] ?? '' ),
		'careers_email' => sanitize_email( $input['careers_email'] ?? '' ),
		'phone'         => sanitize_text_field( $input['phone'] ?? '' ),
		'offices'       => array(),
		'social'        => array(),
	);
	foreach ( (array) ( $input['offices'] ?? array() ) as $office ) {
		$office = array(
			'label'   => sanitize_text_field( $office['label'] ?? '' ),
			'address' => sanitize_textarea_field( $office['address'] ?? '' ),
			'phone'   => sanitize_text_field( $office['phone'] ?? '' ),
			'email'   => sanitize_email( $office['email'] ?? '' ),
		);
		if ( $office['label'] || $office['address'] ) {
			$out['offices'][] = $office;
		}
	}
	foreach ( array( 'facebook', 'x', 'linkedin' ) as $network ) {
		$out['social'][ $network ] = esc_url_raw( $input['social'][ $network ] ?? '' );
	}
	return $out;
}

/**
 * Register the option and its admin page.
 */
function us24_site_register_settings() {
	register_setting(
		'us24_site',
		'us24_site',
		array(
			'type'              => 'array',
			'sanitize_callback' => 'us24_site_sanitize_settings',
			'default'           => us24_site_defaults(),
		)
	);
}
add_action( 'admin_init', 'us24_site_register_settings' );

/**
 * Menu entry.
 */
function us24_site_settings_menu() {
	add_options_page( __( 'US24 Site', 'us24-site' ), __( 'US24 Site', 'us24-site' ), 'manage_options', 'us24-site', 'us24_site_settings_page' );
}
add_action( 'admin_menu', 'us24_site_settings_menu' );

/**
 * Settings screen.
 */
function us24_site_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$s       = us24_site_settings();
	$offices = array_pad( $s['offices'], 3, array( 'label' => '', 'address' => '', 'phone' => '', 'email' => '' ) );
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'US24 Site settings', 'us24-site' ); ?></h1>
		<p><?php esc_html_e( 'These details appear in the header, footer, contact sections and form emails across the whole site.', 'us24-site' ); ?></p>
		<form method="post" action="options.php">
			<?php settings_fields( 'us24_site' ); ?>
			<h2><?php esc_html_e( 'Forms and main contact', 'us24-site' ); ?></h2>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="us24-email"><?php esc_html_e( 'Enquiries go to', 'us24-site' ); ?></label></th>
					<td><input id="us24-email" class="regular-text" type="email" name="us24_site[email]" value="<?php echo esc_attr( $s['email'] ); ?>"></td>
				</tr>
				<tr>
					<th scope="row"><label for="us24-careers"><?php esc_html_e( 'Job applications go to', 'us24-site' ); ?></label></th>
					<td><input id="us24-careers" class="regular-text" type="email" name="us24_site[careers_email]" value="<?php echo esc_attr( $s['careers_email'] ); ?>"></td>
				</tr>
				<tr>
					<th scope="row"><label for="us24-phone"><?php esc_html_e( 'Header phone number', 'us24-site' ); ?></label></th>
					<td><input id="us24-phone" class="regular-text" type="text" name="us24_site[phone]" value="<?php echo esc_attr( $s['phone'] ); ?>"></td>
				</tr>
			</table>
			<h2><?php esc_html_e( 'Offices', 'us24-site' ); ?></h2>
			<table class="form-table" role="presentation">
				<?php foreach ( $offices as $i => $o ) : ?>
				<tr>
					<th scope="row"><?php echo esc_html( sprintf( /* translators: %d: office number */ __( 'Office %d', 'us24-site' ), $i + 1 ) ); ?></th>
					<td>
						<p><input class="regular-text" type="text" placeholder="<?php esc_attr_e( 'Label, e.g. UK Office', 'us24-site' ); ?>" name="us24_site[offices][<?php echo (int) $i; ?>][label]" value="<?php echo esc_attr( $o['label'] ); ?>"></p>
						<p><textarea class="large-text" rows="2" placeholder="<?php esc_attr_e( 'Address (one line per row)', 'us24-site' ); ?>" name="us24_site[offices][<?php echo (int) $i; ?>][address]"><?php echo esc_textarea( $o['address'] ); ?></textarea></p>
						<p><input class="regular-text" type="text" placeholder="<?php esc_attr_e( 'Phone', 'us24-site' ); ?>" name="us24_site[offices][<?php echo (int) $i; ?>][phone]" value="<?php echo esc_attr( $o['phone'] ); ?>">
						<input class="regular-text" type="email" placeholder="<?php esc_attr_e( 'Email', 'us24-site' ); ?>" name="us24_site[offices][<?php echo (int) $i; ?>][email]" value="<?php echo esc_attr( $o['email'] ); ?>"></p>
					</td>
				</tr>
				<?php endforeach; ?>
			</table>
			<h2><?php esc_html_e( 'Social profiles', 'us24-site' ); ?></h2>
			<table class="form-table" role="presentation">
				<?php foreach ( array( 'facebook' => 'Facebook', 'x' => 'X (Twitter)', 'linkedin' => 'LinkedIn' ) as $key => $label ) : ?>
				<tr>
					<th scope="row"><label for="us24-social-<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $label ); ?></label></th>
					<td><input id="us24-social-<?php echo esc_attr( $key ); ?>" class="regular-text" type="url" name="us24_site[social][<?php echo esc_attr( $key ); ?>]" value="<?php echo esc_attr( $s['social'][ $key ] ?? '' ); ?>"></td>
				</tr>
				<?php endforeach; ?>
			</table>
			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}

/**
 * A phone number as a tel: URL.
 *
 * @param string $phone Display number.
 * @return string
 */
function us24_site_tel( $phone ) {
	return 'tel:' . preg_replace( '/[^0-9+]/', '', (string) $phone );
}
