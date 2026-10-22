import { TinymceInitOptions } from '@wawjs/ngx-tinymce';

/** Tags TinyMCE drops, so writers add text only. firestore.rules refuses them too. */
const NO_ASSET_ELEMENTS =
	'img,picture,source,video,audio,track,iframe,frame,object,embed,svg,canvas,script,style,form,input';

/**
 * TinyMCE setup shared by the chapter and codex editors.
 * `blockFormats` is TinyMCE's `Label=tag; ...` list, already translated.
 */
export function writerTinymceConfig(dark: boolean, blockFormats: string): TinymceInitOptions {
	return {
		license_key: 'gpl',
		menubar: false,
		branding: false,
		promotion: false,
		plugins: 'lists link autoresize',
		toolbar:
			'undo redo | blocks | bold italic | bullist numlist blockquote | link | removeformat',
		block_formats: blockFormats,
		invalid_elements: NO_ASSET_ELEMENTS,
		valid_styles: { '*': '' },
		paste_data_images: false,
		paste_block_drop: true,
		link_default_target: '_blank',
		min_height: 360,
		autoresize_bottom_margin: 24,
		skin: dark ? 'oxide-dark' : 'oxide',
		content_css: dark ? 'dark' : 'default',
		content_style:
			"body { font-family: 'Alegreya', Georgia, serif; font-size: 19px; line-height: 1.7; }",
	};
}
