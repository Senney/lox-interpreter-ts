var height = 300;
var width = 640;
var max = 1000;

for (var row = 0; row < height; row = row + 1) {
  var out = "";

  for (var col = 0; col < width; col = col + 1) {
    var c_re = (((col - width) / 2) * 4) / width;
    var c_im = (((row - height) / 2) * 4) / width;
    var x = 0;
    var y = 0;
    var iteration = 0;

    while (((x*x) + (y*y) <= 4) and (iteration < max)) {
      var x_new = (x * x) - (y * y) + c_re;
      y = 2 * x * y + c_im;
      x = x_new;

      iteration = iteration + 1;
    }

    if (iteration < max) {
      out = out + "-";
    } else {
      out = out + "x";
    }
  }

  print out;
}
