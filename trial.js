/* eslint no-var: 0 */
var video = document.querySelector("#videoElement");
var results = document.getElementById('results');
navigator.getUserMedia =
  navigator.getUserMedia
  || navigator.webkitGetUserMedia
  || navigator.mozGetUserMedia
  || navigator.msGetUserMedia
  || navigator.oGetUserMedia;

function handleVideo(stream) {
  video.src = window.URL.createObjectURL(stream);
}

function videoError(e) {
  console.log('videoError:', e);
}

if (navigator.getUserMedia) {
  navigator.getUserMedia({ video: true }, handleVideo, videoError);
}

// taken from:
// https://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
function dataURItoBlob(dataURI) {
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
  var byteString = atob(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);

  // create a view into the buffer
  var ia = new Uint8Array(ab);

  // set the bytes of the buffer to the correct values
  for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }

  // write the ArrayBuffer to a blob, and you're done
  var blob = new Blob([ab], {type: mimeString});
  return blob;
}

function draw(v, c, w, h) {
  var textnode;
  var dataURI;
  var blob;
  var node;
  var bodyFormData;
  var canvas = document.getElementById('cropped');

  c.drawImage(v, 150, 100, 350, 350, 0, 0, 250, 250);

  // convert to jpeg to get rid of alpha value,
  // craftar throws error otherwise
  dataURI = canvas.toDataURL('image/jpeg', 1.0);
  blob = dataURItoBlob(dataURI);

  bodyFormData = new FormData();
  bodyFormData.append('image', blob);
  bodyFormData.append('token', 'INSERT YOUR TOKEN ID HERE');

  node = document.createElement('LI');

  return axios({
    method: 'post',
    headers: { 'Content-Type': 'multipart/form-data' },
    url: 'https://search.craftar.net/v1/search',
    params: {
      api_key: 'INSERT YOUR API KEY HERE',
    },
    data: bodyFormData,
  })
    .then((resp) => {
      if (resp.data.results.length === 0) {
        textnode = document.createTextNode('No matches, try again.');
        node.appendChild(textnode);
        results.appendChild(node);
        return setTimeout(draw, 5000, v, c, w, h);
      }
      textnode = document.createTextNode(resp.data.results.toString());
      node.appendChild(textnode);
      return results.appendChild(node);
    })
    .catch((err) => {
      textnode = document.createTextNode(err);
      node.appendChild(textnode);
      results.appendChild(node);
      setTimeout(draw, 5000, v, c, w, h);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  var v = document.getElementsByTagName('video')[0];
  var canvas = document.getElementById('cropped');
  var context = canvas.getContext('2d');

  var cw = 250; // Math.floor(canvas.clientWidth / 100);
  var ch = 250; // Math.floor(canvas.clientHeight / 100);
  canvas.width = cw;
  canvas.height = ch;
  draw(v, context, cw, ch);
}, false);
