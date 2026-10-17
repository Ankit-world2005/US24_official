<?php
/**
 * Dynamic blocks: us24/contact-form and us24/offices.
 *
 * @package US24_Site
 */

defined( 'ABSPATH' ) || exit;

/**
 * Register both blocks from their block.json files.
 */
function us24_site_register_blocks() {
	register_block_type( US24_SITE_DIR . 'blocks/contact-form', array( 'render_callback' => 'us24_site_render_contact_form' ) );
	register_block_type( US24_SITE_DIR . 'blocks/offices', array( 'render_callback' => 'us24_site_render_offices' ) );
}
add_action( 'init', 'us24_site_register_blocks' );

/**
 * Offices block.
 *
 * @param array $attributes Block attributes.
 * @return string
 */
function us24_site_render_offices( $attributes ) {
	$layout = ( $attributes['layout'] ?? 'cards' ) === 'list' ? 'is-list' : 'is-cards';
	$html   = '';
	foreach ( us24_site_settings()['offices'] as $o ) {
		$lines = array();
		if ( $o['phone'] ) {
			$lines[] = '<a href="' . esc_url( us24_site_tel( $o['phone'] ) ) . '">' . esc_html( $o['phone'] ) . '</a>';
		}
		if ( $o['email'] ) {
			$lines[] = '<a href="mailto:' . esc_attr( antispambot( $o['email'] ) ) . '">' . esc_html( antispambot( $o['email'] ) ) . '</a>';
		}
		$html .= '<div class="us24-office"><h3>' . esc_html( $o['label'] ) . '</h3><p>' . nl2br( esc_html( $o['address'] ) ) . '</p>'
			. ( $lines ? '<p>' . implode( '<br>', $lines ) . '</p>' : '' ) . '</div>';
	}
	return '<div ' . get_block_wrapper_attributes( array( 'class' => 'us24-offices ' . $layout ) ) . '>' . $html . '</div>';
}

/**
 * Contact / career form block. Posts to admin-post.php; see forms.php for the handler.
 *
 * @param array $attributes Block attributes.
 * @return string
 */
function us24_site_render_contact_form( $attributes ) {
	static $instance = 0;
	++$instance;
	$career = ( $attributes['variant'] ?? 'contact' ) === 'career';
	$id     = 'us24-form-' . $instance;
	$submit = trim( (string) ( $attributes['submitLabel'] ?? '' ) );
	if ( '' === $submit ) {
		$submit = $career ? __( 'Send application', 'us24-site' ) : __( 'Get my free quote', 'us24-site' );
	}

	// Status after the redirect back from the handler. Read-only display of a fixed set of codes.
	$status  = isset( $_GET['us24_form'] ) ? sanitize_key( wp_unslash( $_GET['us24_form'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$notices = array(
		'sent'    => array( 'is-success', $career ? __( 'Thank you. Your application has been sent to our HR team.', 'us24-site' ) : __( 'Thank you. A member of our team will be in touch shortly.', 'us24-site' ) ),
		'invalid' => array( 'is-error', __( 'Please fill in the required fields with a valid email address.', 'us24-site' ) ),
		'file'    => array( 'is-error', __( 'Please attach your CV as a PDF, DOC or DOCX file under 5 MB.', 'us24-site' ) ),
		'busy'    => array( 'is-error', __( 'Too many messages from your connection. Please try again in a few minutes.', 'us24-site' ) ),
		'failed'  => array( 'is-error', __( 'Sorry, the message could not be sent. Please email us directly.', 'us24-site' ) ),
	);

	ob_start();
	?>
	<form <?php echo get_block_wrapper_attributes( array( 'class' => 'us24-form', 'id' => $id ) ); // phpcs:ignore WordPress.Security.EscapeOutput ?> method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>"<?php echo $career ? ' enctype="multipart/form-data"' : ''; ?>>
		<?php if ( isset( $notices[ $status ] ) ) : ?>
			<p class="us24-form__notice <?php echo esc_attr( $notices[ $status ][0] ); ?>" role="status"><?php echo esc_html( $notices[ $status ][1] ); ?></p>
		<?php endif; ?>
		<input type="hidden" name="action" value="us24_form">
		<input type="hidden" name="us24_variant" value="<?php echo $career ? 'career' : 'contact'; ?>">
		<input type="hidden" name="us24_anchor" value="<?php echo esc_attr( $id ); ?>">
		<div class="us24-hp" aria-hidden="true"><label><?php esc_html_e( 'Leave this empty', 'us24-site' ); ?><input type="text" name="us24_website" tabindex="-1" autocomplete="off"></label></div>
		<div class="us24-form__row">
			<label><?php esc_html_e( 'Full name', 'us24-site' ); ?> *<input type="text" name="us24_name" required maxlength="120" autocomplete="name"></label>
			<label><?php esc_html_e( 'Email', 'us24-site' ); ?> *<input type="email" name="us24_email" required maxlength="160" autocomplete="email"></label>
		</div>
		<div class="us24-form__row">
			<label><?php esc_html_e( 'Phone', 'us24-site' ); ?><input type="tel" name="us24_phone" maxlength="40" autocomplete="tel"></label>
			<?php if ( $career ) : ?>
			<label><?php esc_html_e( 'Position you are applying for', 'us24-site' ); ?> *<input type="text" name="us24_position" required maxlength="120"></label>
			<?php else : ?>
			<label><?php esc_html_e( 'Company / practice', 'us24-site' ); ?><input type="text" name="us24_company" maxlength="160" autocomplete="organization"></label>
			<?php endif; ?>
		</div>
		<?php if ( $career ) : ?>
		<label><?php esc_html_e( 'CV / résumé (PDF, DOC or DOCX, max 5 MB)', 'us24-site' ); ?> *<input type="file" name="us24_resume" required accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"></label>
		<?php endif; ?>
		<label><?php echo $career ? esc_html__( 'Anything you would like us to know', 'us24-site' ) : esc_html__( 'How can we help?', 'us24-site' ) . ' *'; ?><textarea name="us24_message" maxlength="5000" rows="5"<?php echo $career ? '' : ' required'; ?>></textarea></label>
		<button type="submit" class="us24-form__submit wp-element-button"><?php echo esc_html( $submit ); ?></button>
		<p class="us24-form__note"><?php esc_html_e( 'We reply within one business day. Please do not include patient health information in this form.', 'us24-site' ); ?></p>
	</form>
	<?php
	return (string) ob_get_clean();
}
