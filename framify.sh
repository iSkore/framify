# get the first input variable
VIDEO=$1

# extract the name without extension
NAME=$(basename "${VIDEO%.*}")

# tack on .png as the output image extension
IMG_NAME=$NAME.png

# remove spaces from the output folder name because no one likes spaces
OUTPUT_FOLDER=`echo $NAME | tr '\ ' '_'`

# let the user know what's about to happen
echo scanning \"$VIDEO\" - saving to \"$NAME\"
echo VIDEO: $VIDEO
echo NAME: $NAME
echo IMG_NAME: $IMG_NAME
echo OUTPUT_FOLDER: $OUTPUT_FOLDER

# create the output folder
mkdir -p $OUTPUT_FOLDER

# OPTIONAL - get the output length in seconds/frames of the video
# docker run -it -v `pwd`:`pwd` -w `pwd` --entrypoint=ffprobe --rm jrottenberg/ffmpeg -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ./<VIDEO>

# scan the video with ffmpeg and condense the whole thing into 1x1 pixel images. save the output into "frame number.png"
docker run -it -v `pwd`:`pwd` -w `pwd` --rm jrottenberg/ffmpeg -i "$VIDEO" -vf scale=1:1 -r 1 "$OUTPUT_FOLDER/%06d.png"

# append each 1x1 image in the output folder into a gigantic X frames by 1 pixel image
docker run -it -v `pwd`:`pwd` -w `pwd` --entrypoint=convert --rm dpokidov/imagemagick +append "$OUTPUT_FOLDER/*" "$IMG_NAME"

# scale the image up to 3056, this is an arbitrary number
docker run -it -v `pwd`:`pwd` -w `pwd` --entrypoint=mogrify --rm dpokidov/imagemagick -scale x3056\! "$IMG_NAME"

# resize to 12x36 aspect ratio (9168x3056) again, arbitrary numbers. size it to whatever you want
docker run -it -v `pwd`:`pwd` -w `pwd` --entrypoint=convert --rm dpokidov/imagemagick "$IMG_NAME" -resize 9168x3056\! -quality 100 "$IMG_NAME"
