const sync = new HugeStorageSync();

(async () => {
    console.log('Trackfy YouTube loaded');

    setInterval(parseVideos, 2000);

    let watchedVideos = await storageGet('watchedVideos');
    if (!watchedVideos || !watchedVideos.length) {
        watchedVideos = [];
        await storageSet('watchedVideos', watchedVideos);
    }

    /*
    * <yt-icon-button id="button" class="dropdown-trigger style-scope ytd-menu-renderer"><button id="button" class="style-scope yt-icon-button" aria-label="More actions">
      <yt-icon class="style-scope ytd-menu-renderer"><svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" class="style-scope yt-icon" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g class="style-scope yt-icon">
        <circle cx="5" cy="12" r="2" class="style-scope yt-icon"></circle><circle cx="12" cy="12" r="2" class="style-scope yt-icon"></circle><circle cx="19" cy="12" r="2" class="style-scope yt-icon"></circle>
      </g></svg>


  </yt-icon>
    </button><paper-ripple class="style-scope yt-icon-button circle">


    <div id="background" class="style-scope paper-ripple" style="opacity: 0;"></div>
    <div id="waves" class="style-scope paper-ripple"></div>
  </paper-ripple></yt-icon-button>
    * */

    const $markAsWatchedIcon = $(`
            <yt-icon-button id="button" class="dropdown-trigger style-scope ytd-menu-renderer tfy-mark-as-watched-icon">
                <button id="button" class="style-scope yt-icon-button" aria-label="Mark as watched">
                  <div class="style-scope ytd-menu-renderer">
                    <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" class="style-scope yt-icon" style="pointer-events: none; display: block; width: 100%; height: 100%;">
                        <path fill="#616161" class="style-scope yt-icon" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                    </svg>
                  </div>
                </button>
                <paper-ripple class="style-scope yt-icon-button circle">
                    <div id="background" class="style-scope paper-ripple" style="opacity: 0;"></div>
                    <div id="waves" class="style-scope paper-ripple"></div>
                </paper-ripple>
            </yt-icon>
        `);

    const markAsWatchedIcon = `
              <div class="style-scope ytd-menu-renderer" title="Mark as watched">
                <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" class="style-scope yt-icon" style="pointer-events: none; display: block; width: 100%; height: 100%;">
                    <path fill="#616161" class="style-scope yt-icon" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                </svg>
              </div>
        `;

    const unmarkAsWatchedIcon = `
              <div class="style-scope ytd-menu-renderer" title="Clear watched">
                <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" class="style-scope yt-icon" style="pointer-events: none; display: block; width: 100%; height: 100%;">
                    <path fill="#616161" class="style-scope yt-icon" d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.08L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.74,7.13 11.35,7 12,7Z" />
                </svg>
              </div>
        `;

    const youtubeIdRegex = /^(?:\/watch\?=)?(?:http(?:s)?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:(?:watch)?\?(?:.*&)?v(?:i)?=|(?:embed|v|vi|user)\/)|\/(?:(?:watch)?\?(?:.*&)?v(?:i)?=|(?:embed|v|vi|user)\/))([^?&"'>]+)/;
    const $markAsWatched = $('<a href="#" class="tfy-mark-as-watched">Mark as watched</a>');

    let iterationCount = 0;
    let iterating = false;

    async function parseVideos() {

        const $video = $(`ytd-grid-video-renderer:not(.tfy-loaded),
            ytd-compact-video-renderer:not(.tfy-loaded), 
            ytd-video-renderer:not(.tfy-loaded),
            ytd-playlist-video-renderer:not(.tfy-loaded)`);

        iterationCount = $video.length;

        watchedVideos = await storageGet('watchedVideos');

        if (!iterating) {
            $video.each(async (i, item) => {
                if ($(item).length) {
                    let $markAsWatchedClone = $(item).find('.tfy-mark-as-watched');

                    let $metaLine;
                    let id;

                    if (!$(item).is('ytd-playlist-video-renderer')) {
                        id = $(item).find('#thumbnail').attr('href').match(youtubeIdRegex)[1];

                        $metaLine = $(item).find('#metadata-line');
                    } else {
                        id = $(item).find('a').attr('href').match(youtubeIdRegex)[1];

                        $metaLine = $(item).find('#meta');
                    }

                    if (!$markAsWatchedClone.length) {
                        $markAsWatchedClone = $markAsWatched.clone(true);

                        $markAsWatchedClone.on('click', async e => {
                            if (!$(item).is('ytd-playlist-video-renderer')) {
                                id = $(item).find('#thumbnail').attr('href').match(youtubeIdRegex)[1];
                            } else {
                                id = $(item).find('a').attr('href').match(youtubeIdRegex)[1];
                            }

                            e.stopPropagation();
                            e.stopImmediatePropagation();
                            e.preventDefault();

                            if ($markAsWatchedClone.html() === 'Mark as watched') {
                                $markAsWatchedClone.html('Clear watched');

                                $(item).find('#overlays').prepend('<div class="tfy-status-watched">Watched</div>');
                                $(item).addClass('watched');

                                watchedVideos = await storageGet('watchedVideos');
                                if (!watchedVideos.includes(id)) {
                                    watchedVideos.push(id);
                                }
                            } else {
                                $markAsWatchedClone.html('Mark as watched');

                                $(item).find('#overlays .tfy-status-watched').remove();
                                $(item).removeClass('watched');

                                watchedVideos = await storageGet('watchedVideos');
                                watchedVideos.splice(watchedVideos.indexOf(id), 1);
                            }

                            await storageSet('watchedVideos', watchedVideos);
                        });

                        $metaLine.append($markAsWatchedClone);
                    }

                    if (id) {
                        if ($(item).find('#progress').length && !watchedVideos.includes(id)) {
                            watchedVideos.push(id);
                        }

                        if (watchedVideos.includes(id)) {
                            $markAsWatchedClone.html('Clear watched');

                            if (!$(item).find('#overlays .tfy-status-watched').length) {
                                $(item).find('#overlays').prepend('<div class="tfy-status-watched">Watched</div>');
                            }
                            $(item).addClass('watched');
                        } else {
                            $markAsWatchedClone.html('Mark as watched');

                            $(item).find('#overlays .tfy-status-watched').remove();
                            $(item).removeClass('watched');
                        }
                    }
                }

                iterating = i !== iterationCount - 1;
            });
        }

        $('ytd-video-primary-info-renderer').each((i, item) => {
            let id = window.location.href.match(youtubeIdRegex) ? window.location.href.match(youtubeIdRegex)[1] : null;

            if ($(item).length && id) {
                let $markAsWatchedIconClone = $(item).find('ytd-menu-renderer .tfy-mark-as-watched-icon');

                if (!$markAsWatchedIconClone.length) {
                    $markAsWatchedIconClone = $markAsWatchedIcon.clone(true);

                    $markAsWatchedIconClone.on('click', async e => {
                        id = window.location.href.match(youtubeIdRegex) ? window.location.href.match(youtubeIdRegex)[1] : null;

                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        e.preventDefault();

                        if (!$(item).hasClass('watched')) {
                            $markAsWatchedIconClone.find('button').html(unmarkAsWatchedIcon);

                            $(item).addClass('watched');

                            watchedVideos = await storageGet('watchedVideos');
                            if (!watchedVideos.includes(id)) {
                                watchedVideos.push(id);
                            }
                        } else {
                            $markAsWatchedIconClone.find('button').html(markAsWatchedIcon);

                            $(item).removeClass('watched');

                            watchedVideos = await storageGet('watchedVideos');
                            watchedVideos.splice(watchedVideos.indexOf(id), 1);
                        }

                        await storageSet('watchedVideos', watchedVideos);
                    });

                    $(item).find('ytd-menu-renderer').append($markAsWatchedIconClone);
                }

                if (watchedVideos.includes(id)) {
                    $markAsWatchedIconClone.find('button').html(unmarkAsWatchedIcon);

                    $(item).addClass('watched');
                } else {
                    $markAsWatchedIconClone.find('button').html(markAsWatchedIcon);

                    $(item).removeClass('watched');
                }
            }
        });
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
