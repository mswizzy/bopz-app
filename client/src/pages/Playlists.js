import { useState, useEffect } from 'react';
import { catchErrors } from '../utils';
import { getCurrentUserPlaylists } from '../spotify';
import { SectionWrapper,PlaylistsGrid, Loader } from '../components';
import axios from 'axios';

const Playlists = () => {
    const [playlistsData, setPlaylistsData] = useState(null);
    const [playlists, setPlaylists] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const userPlaylists = await getCurrentUserPlaylists();
            setPlaylistsData(userPlaylists.data);
        };

        catchErrors(fetchData());
  }, []);


    //when playlistData updates, check if there are more playlists to get
    // then update the state variable
    useEffect(() => {
        if (!playlistsData) {
            return;
        }
        //Playlist endpoint only returns 20 playlists at a time
        // to make sure we get ALL playlists getch the next set of playlists
        const fetchMoreData = async () => {
            if (playlistsData.next) {
                const { data } = await axios.get(playlistsData.next);
                setPlaylistsData(data);
            }
        };

        //use functional update to update playlists state variable to avoid
        // including playlists as a dependency for this hook & creating an infinite loop
        setPlaylists(playlist => ([
            ...playlists ? playlists : [],
            ...playlistsData.items
        ]));

        //fetch next set of playlists as needed
        catchErrors(fetchMoreData());
    }, [playlistsData]);

    return (
        <main>
            <SectionWrapper title="Playlists" breadcrumb="true">
                {playlists ? (
                    <PlaylistsGrid playlists={playlists}/>
                ) : (
                    <Loader/>
                )}
            </SectionWrapper>
        </main>
    )
}

export default Playlists;