const TCP = process.binding('tcp_wrap').TCP;

let handle = new TCP();

let err = handle.bind6('::', 4000);
console.log(err);

err = handle.listen(511);
console.log(err);

err = handle.listen(511);
console.log(err);
