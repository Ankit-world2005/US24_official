/* Editor UI for us24/offices: live server preview and a layout switch. */
( function ( wp ) {
	const el = wp.element.createElement;
	const { __ } = wp.i18n;
	const { InspectorControls, useBlockProps } = wp.blockEditor;
	const { PanelBody, SelectControl } = wp.components;
	wp.blocks.registerBlockType( 'us24/offices', {
		edit: function ( props ) {
			return el(
				'div',
				useBlockProps(),
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{ title: __( 'Offices', 'us24-site' ) },
						el( 'p', null, __( 'Edit addresses under Settings → US24 Site.', 'us24-site' ) ),
						el( SelectControl, {
							label: __( 'Layout', 'us24-site' ),
							value: props.attributes.layout,
							options: [ { label: __( 'Cards', 'us24-site' ), value: 'cards' }, { label: __( 'Plain list', 'us24-site' ), value: 'list' } ],
							onChange: ( v ) => props.setAttributes( { layout: v } ),
						} )
					)
				),
				el( wp.serverSideRender, { block: 'us24/offices', attributes: props.attributes } )
			);
		},
		save: () => null,
	} );
} )( window.wp );
