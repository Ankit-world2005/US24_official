/* Editor UI for us24/contact-form: live server preview and a variant switch. */
( function ( wp ) {
	const el = wp.element.createElement;
	const { __ } = wp.i18n;
	const { InspectorControls, useBlockProps } = wp.blockEditor;
	const { PanelBody, SelectControl, TextControl } = wp.components;
	wp.blocks.registerBlockType( 'us24/contact-form', {
		edit: function ( props ) {
			const a = props.attributes;
			return el(
				'div',
				useBlockProps(),
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{ title: __( 'Form', 'us24-site' ) },
						el( SelectControl, {
							label: __( 'Form type', 'us24-site' ),
							value: a.variant,
							options: [
								{ label: __( 'Enquiry / free quote', 'us24-site' ), value: 'contact' },
								{ label: __( 'Job application (with CV upload)', 'us24-site' ), value: 'career' },
							],
							onChange: ( v ) => props.setAttributes( { variant: v } ),
						} ),
						el( TextControl, { label: __( 'Button label', 'us24-site' ), help: __( 'Leave empty for the default.', 'us24-site' ), value: a.submitLabel, onChange: ( v ) => props.setAttributes( { submitLabel: v } ) } )
					)
				),
				el( wp.serverSideRender, { block: 'us24/contact-form', attributes: a } )
			);
		},
		save: () => null,
	} );
} )( window.wp );
