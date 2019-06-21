const sync = new HugeStorageSync();

(async () => {
    const youtubeIdRegex = /^(?:\/watch\?=)?(?:http(?:s)?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:(?:watch)?\?(?:.*&)?v(?:i)?=|(?:embed|v|vi|user)\/)|\/(?:(?:watch)?\?(?:.*&)?v(?:i)?=|(?:embed|v|vi|user)\/))([^?&"'>]+)/;

    $(document).on('DOMContentLoaded', () => {
        $('#clearAll').on('click', async () => {
            let watchedVideos = [];
            await storageSet('watchedVideos', watchedVideos);
            await listIds();
            $('.message.clear').addClass('show');
        });

        $("#backupIds").click(async () => {
            await listIds();

            let watchedVideos = await storageGet('watchedVideos');
            if (!watchedVideos || !watchedVideos.length) {
                watchedVideos = [];
                await storageSet('watchedVideos', watchedVideos);
            }

            const blob = new Blob([watchedVideos.join(',')], {type: "text/plain;charset=utf-8"});
            saveAs(blob, 'trackfy-youtube.bkp');

            $('.message.backup').html(`Backup saved!`).removeClass('error').addClass('show');
        });

        $('#restoreIdsButton').on('click', function () {
            $('#restoreIds').click();
        });

        $('#restoreIds').on('change', function () {
            const file = $('#restoreIds')[0].files[0];
            if (file) {
                const reader = new FileReader();
                reader.readAsText(file, "UTF-8");
                reader.onload = async (evt) => {
                    try {
                        let watchedVideos = evt.target.result.replace(/[\[\]"]/g, '').split(',');
                        await storageSet('watchedVideos', watchedVideos);
                        $('.message.backup').html(`Backup restored!`).removeClass('error').addClass('show');

                        await listIds();
                    } catch (e) {
                        $('.message.backup').html(`Invalid backup file`).addClass('show error');
                        console.log(e);
                    }
                };
                reader.onerror = () => {
                    $('.message.backup').html(`Error reading file`).addClass('show error');
                }
            }
            $(this).val('');
        });

        $('#syncHistory').on('click', () => {
            chrome.history.search({text: 'youtube.com', startTime: 0, maxResults: 9999999}, async (results) => {
                let addCount = 0;

                let watchedVideos = await storageGet('watchedVideos');
                if (!watchedVideos || !watchedVideos.length) {
                    watchedVideos = [];
                    await storageSet('watchedVideos', watchedVideos);
                }

                for (let item of results) {
                    const id = item.url.match(youtubeIdRegex) ? item.url.match(youtubeIdRegex)[1] : null;

                    if (id && /^[A-Za-z0-9_-]{11}$/.test(id) && !watchedVideos.includes(id)) {
                        addCount++;
                        watchedVideos.push(id);
                    }
                }

                await storageSet('watchedVideos', watchedVideos);

                await listIds();

                $('.message.sync').html(`Synced ${addCount} videos!`).addClass('show');
            });
        });
    });

    // setInterval(listIds, 2000);
    await listIds();

    async function listIds() {
        let watchedVideos = await storageGet('watchedVideos');
        if (!watchedVideos || !watchedVideos.length) {
            watchedVideos = [];
            await storageSet('watchedVideos', watchedVideos);
        }

        watchedVideos.forEach(item => {
            if (!/^[A-Za-z0-9_-]{11}$/.test(item)) {
                watchedVideos.splice(watchedVideos.indexOf(item), 1);
            }
        });

        await storageSet('watchedVideos', watchedVideos);

        $('#watchedVideoCount').html(watchedVideos.length);
    }

    async function storageSet(name, value) {
        try {
            value = value.join(',');
        } catch (error) {
        }

        return await new Promise((resolve) => {
            // const data = {};
            // data[name] = value;
            sync.set(name, value, resolve);
        });
    }

    async function storageGet(name) {
        let data = await new Promise((resolve) => {
            sync.get(name, (r) => {
                resolve(r);
            });
        });

        try {
            data = data.split(',');
        } catch (error) {
        }

        return data
    }
})();
