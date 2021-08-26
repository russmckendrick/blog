# MediaGlasses Blog

This is the code for https://www.mediaglasses.blog/

## Tools

- Built using [Hugo](https://gohugo.io/).
- Using the [PaperMod](https://github.com/adityatelange/hugo-PaperMod) theme.
- Hosted on [Cloudflare Pages](https://pages.cloudflare.com/).
- Uses ...
    - [giscus](https://giscus.app)
    - [Goat Counter](https://goatcounter.com)
    - [SharingButtons](https://sharingbuttons.io)
    - [Cloudimage](https://www.cloudimage.io/)

## TODO

- [x] Add icons to main menu, added the [Ionicons](https://ionic.io/ionicons) icons.
- [x] Generate `_redirects` file for 301 redirects, see [here](https://github.com/russmckendrick/blog/blob/main/layouts/_default/home._redirects) and [this config](https://github.com/russmckendrick/blog/blob/2435118e406b146fc1934602b28ac71fa0d199de/config.yml#L151-L163).
- [x] Optimize images, see this [GitHub Action](https://github.com/russmckendrick/blog/blob/main/.github/workflows/calibreapp-image-actions.yml).
- [x] Generate webp images, updated the `{{< img >}}` [short code](https://github.com/russmckendrick/blog/blob/main/layouts/shortcodes/img.html) so that it generates the webp images.
- [x] Terminal, added the terminal style from [https://codeeverywhere.ca/post.php?id=10](https://codeeverywhere.ca/post.php?id=10) as [short code](https://github.com/russmckendrick/blog/blob/main/layouts/shortcodes/terminal.html) and updated the posts.
- [x] Update all old posts so they mostly work.
- [x] Use CDN for cover images
- [] Get as close to 100% on PageSpeed Insights as possible