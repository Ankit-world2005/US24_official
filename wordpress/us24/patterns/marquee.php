<?php
/**
 * Title: Marquee ticker
 * Slug: us24/marquee
 * Categories: featured
 * Inserter: yes
 *
 * Cinematic horizontal marquee ticker band inspired by Scrolltide.
 * Features hairlines, linear gradient edge masking, and monospace uppercase typography.
 *
 * @package US24
 */

$items = array(
	'Revenue Cycle Management',
	'99% First-Pass Payment Rate',
	'Cyber Security 24/7 SOC',
	'Salesforce CRM & Clouds',
	'HIPAA Compliant',
	'ISO 9001:2015 Certified',
	'3 Global Delivery Centres',
	'Chicago · Uxbridge · Noida',
	'Full-Stack Web & Mobile',
	'DevOps & Cloud Infrastructure',
	'Accounting & Payroll',
	'Over 100+ Enterprise Clients',
);
?>
<!-- wp:html -->
<section class="us24-marquee alignfull" aria-label="Key highlights">
	<div class="us24-marquee__track">
		<?php for ( $i = 0; $i < 2; $i++ ) : ?>
			<div class="us24-marquee__group"<?php echo ( $i > 0 ) ? ' aria-hidden="true"' : ''; ?>>
				<?php foreach ( $items as $item ) : ?>
					<span class="us24-marquee__item">
						<?php echo esc_html( $item ); ?>
						<span class="us24-marquee__sep" aria-hidden="true">✦</span>
					</span>
				<?php endforeach; ?>
			</div>
		<?php endfor; ?>
	</div>
</section>
<!-- /wp:html -->
