# Russ.Cloud Blog

This is the code for https://www.russ.cloud/

## Tools

- Built using [Hugo](https://gohugo.io/).
- Using the [PaperMod](https://github.com/adityatelange/hugo-PaperMod) theme.
- Hosted on [Cloudflare Pages](https://pages.cloudflare.com/).
- Uses ...
    - [giscus](https://giscus.app)
    - [Plausible](https://plausible.io)
    - [SharingButtons](https://sharingbuttons.io)
    - [hugo-shortcode-gallery](https://github.com/mfg92/hugo-shortcode-gallery) theme component
    - [hugo-notice](https://github.com/martignoni/hugo-notice) theme component
    - Icons by [Simple Icons](https://simpleicons.org/) and [Feather Icons](https://feathericons.com)

## TODO

- [x] Sort of tagging !!
- [x] Generate `_redirects` file for 301 redirects, see [here](https://github.com/russmckendrick/blog/blob/main/layouts/_default/home._redirects) and [this config](https://github.com/russmckendrick/blog/blob/2435118e406b146fc1934602b28ac71fa0d199de/config.yml#L151-L163).
- [x] Generate webp images, updated the `{{< img >}}` [short code](https://github.com/russmckendrick/blog/blob/main/layouts/shortcodes/img.html) so that it generates the webp images.
- [x] Terminal, added the terminal style from [https://codeeverywhere.ca/post.php?id=10](https://codeeverywhere.ca/post.php?id=10) as [short code](https://github.com/russmckendrick/blog/blob/main/layouts/shortcodes/terminal.html) and updated the posts.
- [x] Update all old posts so they mostly work.
- [x] Get as close to [100% on PageSpeed Insights as possible](https://pagespeed.web.dev/report?url=https%3A%2F%2Fwww.mediaglasses.blog%2F&form_factor=mobile)
- [x] Add auto-generated listened-to blog post, see [here](https://github.com/russmckendrick/blog/blob/main/generate_blog_post.py) for the code.
- [x] ~~Add icons to main menu, added the [Ionicons](https://ionic.io/ionicons) icons.~~ removed due to messing up CLS
- [x] ~~Use CDN for cover images.~~ webp added for cover images
- [x] ~~Optimize images, see this [GitHub Action](https://github.com/russmckendrick/blog/blob/main/.github/workflows/calibreapp-image-actions.yml).~~

