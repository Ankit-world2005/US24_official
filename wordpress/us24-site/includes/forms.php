<?php
/**
 * Form handler for us24/contact-form: validates, emails the right inbox, redirects back with a status.
 *
 * No nonce on purpose: this is a public, logged-out form on pages that LiteSpeed caches, and cached nonces
 * expire and would reject real visitors. There is no privileged action to forge, so spam control is a
 * honeypot field, a per-IP rate limit and length limits instead.
 *
 * @package US24_Site
 */

defined( 'ABSPATH' ) || exit;

add_action( 'admin_post_nopriv_us24_form', 'us24_site_handle_form' );
add_action( 'admin_post_us24_form', 'us24_site_handle_form' );

/**
 * Process a submission.
 */
function us24_site_handle_form() {
	// phpcs:disable WordPress.Security.NonceVerification.Missing -- see file header.
	$post   = wp_unslash( $_POST );
	$career = ( $post['us24_variant'] ?? '' ) === 'career';
	$anchor = sanitize_html_class( $post['us24_anchor'] ?? 'us24-form-1' );

	// Bots fill the hidden field: pretend success and send nothing.
	if ( ! empty( $post['us24_website'] ) ) {
		us24_site_form_redirect( 'sent', $anchor );
	}

	$ip_key = 'us24_form_' . md5( (string) ( $_SERVER['REMOTE_ADDR'] ?? '' ) . wp_salt( 'nonce' ) );
	$count  = (int) get_transient( $ip_key );
	if ( $count >= 5 ) {
		us24_site_form_redirect( 'busy', $anchor );
	}

	$name     = sanitize_text_field( $post['us24_name'] ?? '' );
	$email    = sanitize_email( $post['us24_email'] ?? '' );
	$phone    = sanitize_text_field( $post['us24_phone'] ?? '' );
	$company  = sanitize_text_field( $post['us24_company'] ?? '' );
	$position = sanitize_text_field( $post['us24_position'] ?? '' );
	$message  = sanitize_textarea_field( $post['us24_message'] ?? '' );
	// phpcs:enable

	$invalid = '' === $name || ! is_email( $email ) || mb_strlen( $name ) > 120 || mb_strlen( $message ) > 5000
		|| ( $career ? '' === $position : '' === $message );
	if ( $invalid ) {
		us24_site_form_redirect( 'invalid', $anchor );
	}

	$attachments = array();
	if ( $career ) {
		$file = us24_site_take_resume();
		if ( is_wp_error( $file ) ) {
			us24_site_form_redirect( 'file', $anchor );
		}
		$attachments[] = $file;
	}

	$settings = us24_site_settings();
	$to       = $career ? ( $settings['careers_email'] ?: get_option( 'admin_email' ) ) : ( $settings['email'] ?: get_option( 'admin_email' ) );
	$referer  = wp_get_referer();
	$subject  = $career
		/* translators: 1: position, 2: applicant name */
		? sprintf( __( 'Job application: %1$s (%2$s)', 'us24-site' ), $position, $name )
		/* translators: %s: sender name */
		: sprintf( __( 'Website enquiry from %s', 'us24-site' ), $name );
	$lines    = array(
		__( 'Name', 'us24-site' )     => $name,
		__( 'Email', 'us24-site' )    => $email,
		__( 'Phone', 'us24-site' )    => $phone,
		__( 'Company', 'us24-site' )  => $company,
		__( 'Position', 'us24-site' ) => $position,
		__( 'Page', 'us24-site' )     => $referer ? esc_url_raw( $referer ) : '',
	);
	$body = '';
	foreach ( $lines as $label => $value ) {
		if ( '' !== $value ) {
			$body .= $label . ': ' . $value . "\n";
		}
	}
	$body .= "\n" . $message . "\n";

	// The name is sanitized to one line, so it cannot inject headers.
	$headers = array( 'Reply-To: ' . str_replace( array( '"', "\r", "\n" ), '', $name ) . ' <' . $email . '>' );
	$sent    = wp_mail( $to, $subject, $body, $headers, $attachments );

	foreach ( $attachments as $path ) {
		wp_delete_file( $path );
	}
	set_transient( $ip_key, $count + 1, 10 * MINUTE_IN_SECONDS );
	us24_site_form_redirect( $sent ? 'sent' : 'failed', $anchor );
}

/**
 * Validate the uploaded CV and move it to a temporary file that is deleted after sending.
 *
 * @return string|WP_Error Path to the temporary copy.
 */
function us24_site_take_resume() {
	// phpcs:ignore WordPress.Security.NonceVerification.Missing -- see file header.
	$f = $_FILES['us24_resume'] ?? null;
	if ( ! is_array( $f ) || UPLOAD_ERR_OK !== ( $f['error'] ?? UPLOAD_ERR_NO_FILE ) || ! is_uploaded_file( $f['tmp_name'] ) ) {
		return new WP_Error( 'us24_file', 'missing' );
	}
	if ( (int) $f['size'] <= 0 || (int) $f['size'] > 5 * MB_IN_BYTES ) {
		return new WP_Error( 'us24_file', 'size' );
	}
	$allowed = array(
		'pdf'  => 'application/pdf',
		'doc'  => 'application/msword',
		'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	);
	$check   = wp_check_filetype_and_ext( $f['tmp_name'], $f['name'], $allowed );
	if ( empty( $check['ext'] ) || empty( $check['type'] ) ) {
		return new WP_Error( 'us24_file', 'type' );
	}
	$base = sanitize_file_name( pathinfo( $f['name'], PATHINFO_FILENAME ) );
	$dest = trailingslashit( get_temp_dir() ) . wp_unique_filename( get_temp_dir(), ( $base ?: 'cv' ) . '-' . wp_generate_password( 8, false ) . '.' . $check['ext'] );
	if ( ! move_uploaded_file( $f['tmp_name'], $dest ) ) {
		return new WP_Error( 'us24_file', 'move' );
	}
	return $dest;
}

/**
 * Back to the page the form was on, with a status code for the notice.
 *
 * @param string $status Status code.
 * @param string $anchor Form element id.
 */
function us24_site_form_redirect( $status, $anchor ) {
	$back = wp_get_referer();
	$back = $back ? remove_query_arg( 'us24_form', $back ) : home_url( '/contact/' );
	$back = strtok( $back, '#' );
	wp_safe_redirect( add_query_arg( 'us24_form', $status, $back ) . '#' . $anchor, 303 );
	exit;
}
