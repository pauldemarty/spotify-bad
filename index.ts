import SpotifyWebApi from 'spotify-web-api-node';
import * as dotenv from 'dotenv';
import { DateTime } from 'luxon';

dotenv.config();

const spotify = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
});

spotify.setAccessToken(process.env.ACCESS_TOKEN!);

const artistCode = process.argv[2];

if (!artistCode) {
    console.error("No artist code given, exiting");
    process.exit(1);
}


const main = async (spotify: SpotifyWebApi) => {
    let offset = 50;

    await spotify.refreshAccessToken();
    const response = await spotify.getArtistAlbums(artistCode, {
        limit: 50,
        include_groups: 'appears_on',
    });

    let { body: { items, total } } = response;

    while (offset < total) {
        const response = await spotify.getArtistAlbums(artistCode);

        items = [...items, ...response.body.items];
        offset += 50;
    }

    const sorted = items
        .sort((a, b) => DateTime.fromISO(b.release_date).toMillis() - DateTime.fromISO(a.release_date).toMillis())
        .map(({ album_type, artists, release_date, name, uri }) => ({
            album_type, artists: artists.map(aa => aa.name).join(", "), name, release_date, uri
        }))

    console.table(sorted);
}

main(spotify).then(() => {}, (e) => {
    console.log(e);
    process.exit(1);
})

