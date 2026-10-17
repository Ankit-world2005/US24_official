/* Editor UI for the US24 3D hero: a server-rendered preview plus sidebar fields for the copy.
 * The 3D scene itself only runs on the front end. Plain script, no build step. */
( function ( wp ) {
	const el = wp.element.createElement;
	const { __ } = wp.i18n;
	const { InspectorControls, useBlockProps } = wp.blockEditor;
	const { PanelBody, TextControl, TextareaControl, ToggleControl, RangeControl, Notice } = wp.components;
	const ServerSideRender = wp.serverSideRender;

	wp.blocks.registerBlockType( 'us24/hero-3d', {
		edit: function ( props ) {
			const a = props.attributes;
			const set = ( key ) => ( value ) => props.setAttributes( { [ key ]: value } );
			return el(
				'div',
				useBlockProps(),
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{ title: __( 'Headline & buttons', 'us24' ) },
						el( ToggleControl, { label: __( 'Show headline block', 'us24' ), help: __( 'Turn off when the page puts its own text over the model.', 'us24' ), checked: a.showCopy, onChange: set( 'showCopy' ) } ),
						el( TextControl, { label: __( 'Headline', 'us24' ), help: __( 'Allowed tags: <br>, <em> (orange), <strong>.', 'us24' ), value: a.headline, onChange: set( 'headline' ) } ),
						el( TextareaControl, { label: __( 'Text', 'us24' ), value: a.text, onChange: set( 'text' ) } ),
						el( TextControl, { label: __( 'Primary button label', 'us24' ), value: a.primaryLabel, onChange: set( 'primaryLabel' ) } ),
						el( TextControl, { label: __( 'Primary button link', 'us24' ), value: a.primaryUrl, onChange: set( 'primaryUrl' ) } ),
						el( TextControl, { label: __( 'Secondary button label', 'us24' ), value: a.secondaryLabel, onChange: set( 'secondaryLabel' ) } ),
						el( TextControl, { label: __( 'Secondary button link', 'us24' ), value: a.secondaryUrl, onChange: set( 'secondaryUrl' ) } )
					),
					el(
						PanelBody,
						{ title: __( 'Tour', 'us24' ), initialOpen: false },
						el( ToggleControl, { label: __( 'Play the tour automatically', 'us24' ), checked: a.autoTour, onChange: set( 'autoTour' ) } ),
						el( RangeControl, { label: __( 'Seconds per stop', 'us24' ), min: 3, max: 20, value: a.tourSeconds, onChange: set( 'tourSeconds' ) } )
					)
				),
				el( Notice, { status: 'info', isDismissible: false }, __( 'Preview only: the interactive 3D city loads on the published page.', 'us24' ) ),
				el( ServerSideRender, { block: 'us24/hero-3d', attributes: a } )
			);
		},
		save: function () {
			return null;
		},
	} );
} )( window.wp );
