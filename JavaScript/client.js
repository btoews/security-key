if (!global.u2f && !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)) {
  global.u2f = new u2fClient();
}
