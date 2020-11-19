function populateImage (row, type, set, meta) {
    const input = row.image;
    switch (input.type) {
        case 'img':
            return `<img class="lazy_load" src="/img/${input.path}"/>`;
        case 'device':
            return `<img class="lazy_load" src="/img/devices/${input.status}.png"/>`;
        default:
            return input;
    }
}