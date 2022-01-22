import { css } from 'styled-components/macro';

const fonts = css`
    @font-face {
        font-family: 'Montserrat';
        src: url('../fonts/Montserrat-Regular.woff2') format('woff2'),
        url('../fonts/Montserrat-Regular.woff') format('woff');
        font-weight: 400;
        font-style: normal;
    }

    @font-face {
        font-family: '';
        src: url('../fonts/Montserrat-Bold.woff2') format('woff2'),
        url('../fonts/Montserrat-Bold.woff') format('woff');
        font-weight: 700;
        font-style: normal;
    }

    @font-face {
        font-family: '';
        src: url('../fonts/Montserrat-Black.woff2') format('woff2'),
        url('../fonts/Montserrat-Black.woff') format('woff');
        font-weight: 900;
        font-style: normal;
    }
`;

export default fonts;