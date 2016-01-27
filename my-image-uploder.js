let cropImg = function (img, x1, y1, x2, y2, cb) {
    var canvas = document.createElement("canvas");
    var context = canvas.getContext('2d');
    var imageObj = new Image();
    imageObj.onload = function () {
        // draw cropped image
        var sourceX = x1;
        var sourceY = y1;
        var sourceWidth = x2 - x1;
        var sourceHeight = y2 - y1;
        var destWidth = sourceWidth;
        var destHeight = sourceHeight;
        var destX = 0
        var destY = 0
        canvas.width = sourceWidth;
        canvas.height = sourceHeight;
        canvas.style.width = sourceWidth + 'px';
        canvas.style.height = sourceHeight + 'px';
        context.drawImage(imageObj, sourceX, sourceY, sourceWidth, sourceHeight, destX, destY, destWidth, destHeight);

        var imgData = canvas.toDataURL();
        imageObj.onload=function(){
            imageObj.onload=null
            imageObj.src=imgData;
            if (cb)
                cb(imageObj)
            else
                img = imageObj
        }
        imageObj.src=imgData

    };
    imageObj.src = img.src
}

let imgRotate = function (img, degrees, cb) {
    var canvas = document.createElement("canvas");
    var context = canvas.getContext('2d');
    var imageObj = new Image();
    imageObj.onload = function () {
        canvas.width = imageObj.height;
        canvas.height =  imageObj.width;
        canvas.style.width =  imageObj.height + 'px';
        canvas.style.height =  imageObj.width + 'px';
        context.drawImage(imageObj, 0, 0, imageObj.width, imageObj.height)
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.translate(imageObj.height / 2, imageObj.width/2);
        context.rotate(degrees * Math.PI / 180);
        context.translate(-imageObj.width / 2, -imageObj.height/2 );
        context.drawImage(imageObj, 0,0)
        var imgData = canvas.toDataURL();
        imageObj.onload=function(){
            imageObj.onload=null
            if (cb)
                cb(imageObj)
            else
                img = imageObj
        }
        imageObj.src=imgData;

    };
    imageObj.src = img.src

}

myImageUploader = function (dialog) {

    var img = new Image();
    dialog.bind('imageUploader.fileReady', function (file) {

        var reader = new FileReader();
        reader.onload = function (event) {
            img.src = reader.result
            img.onload = function () {

                dialog.populate(img.src, [img.width, img.height])
                img.onload=null
            }
        };
        reader.readAsDataURL(file);
    })
    dialog.bind('imageUploader.rotateCCW', function () {
        imgRotate(img,-90,function(newImg){

            dialog.populate(newImg.src, [ newImg.width,newImg.height])
            img.src=newImg.src

        });
    });

    dialog.bind('imageUploader.rotateCW', function () {
        imgRotate(img,90,function(newImg){

            dialog.populate(newImg.src, [ newImg.width,newImg.height])
            img.src=newImg.src

        });
    });
    dialog.bind('imageUploader.save', function () {
            var crop, cropRegion, formData;
            // Define a function to handle the request completion
            dialog.busy(false);

            let save = function (img) {
                dialog.save(
                    img.src,
                    [img.width, img.height], {
                        "data-ce-max-width": 1200
                    }
                );
            }
            if (dialog.cropRegion()) {
                let [y1,x1,y2,x2]=dialog.cropRegion()
                x1 = parseInt(x1 * img.width)
                x2 = parseInt(x2 * img.width)
                y1 = parseInt(y1 * img.height)
                y2 = parseInt(y2 * img.height)
                cropImg(img, x1, y1, x2, y2, function (newImg) {
                    img.src = newImg.src
                    save(img)
                })
            } else {
                save(img)
            }


        }
    )                ;
    dialog.bind('imageUploader.clear', function () {
        // Clear the current image
        dialog.clear();
        img = new Image();
    });

}