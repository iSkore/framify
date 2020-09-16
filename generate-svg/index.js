'use strict';

const
    path       = require( 'path' ),
    fs         = require( 'fs' ),
    fsp        = fs.promises,
    XMLBuilder = require( 'xmlbuilder2' ),
    PNG        = require( 'pngjs' ).PNG;

function objectId( len = 16 ) {
    const timestamp = ( new Date().getTime() / 1000 | 0 ).toString( 16 );
    return timestamp + ( 'x'.repeat( len ) )
        .replace( /[x]/g, () => ( ( Math.random() * 16 ) | 0 ).toString( 16 ) )
        .toLowerCase();
}

function rgbToHex( r, g, b ) {
    return '#' + ( ( 1 << 24 ) + ( r << 16 ) + ( g << 8 ) + b ).toString( 16 ).slice( 1 );
}

( async () => {
    console.log( 'generating svg' );
    console.log( process.argv );
    console.log( process.cwd() );
    const dir        = path.resolve( process.argv[ 2 ] );
    const fname      = path.basename( dir );
    const readDir    = await fsp.readdir( dir );
    const fileLength = readDir.length;

    // 36 x 12 aspect ratio
    const data = {
        name: fname,
        svgFileName: path.join( dir, '..', process.argv[ 3 ] || `${ fname }.svg` ),
        width: fileLength,
        height: ~~( fileLength / 3 )
    };

    const xml = XMLBuilder.create( { version: '1.0', encoding: 'UTF-8' } );
    const svg = xml.ele( 'svg', {
        'xmlns': 'http://www.w3.org/2000/svg',
        'xmlns:xlink': 'http://www.w3.org/1999/xlink',
        'width': data.width,
        'height': data.height
    } );
    svg.ele( 'rect', { width: '100%', height: '100%', fill: 'black' } );

    const defs       = svg.ele( 'defs' );
    const clipPathId = objectId();
    const clipPath   = defs.ele( 'clipPath', { id: clipPathId } );
    clipPath.ele( 'rect', { width: data.width, height: data.height } );

    const g = svg.ele( 'g' );
    g.att( 'clip-path', `url(#${ clipPathId })` );

    for ( let i = 0; i < fileLength; i++ ) {
        await new Promise( ( res ) => {
            fs.createReadStream( path.join( dir, readDir[ i ] ) )
                .pipe( new PNG( { filterType: 4 } ) )
                .on( 'parsed', function() {
                    for ( let y = 0; y < this.height; y++ ) {
                        for ( let x = 0; x < this.width; x++ ) {
                            const idx = ( this.width * y + x ) << 2;
                            const rgb = rgbToHex( this.data[ idx ], this.data[ idx + 1 ], this.data[ idx + 2 ] );
                            g.ele( 'rect', { x: i, width: 1, height: data.height, fill: rgb } );
                            res();
                        }
                    }
                } );
        } );
    }

    await fsp.writeFile( data.svgFileName, Buffer.from( xml.end() ) );
} )();

