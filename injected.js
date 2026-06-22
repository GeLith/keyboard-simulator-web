(function() {
  var el = document.body;
  var c = el.getAttribute('data-ks-char') || '';
  if (!c) return 'no-char';

  if (typeof UE !== 'undefined' && UE.instants) {
    var keys = Object.keys(UE.instants);
    for (var i = 0; i < keys.length; i++) {
      var editor = UE.instants[keys[i]];
      if (editor && editor.body && editor.body.contentEditable === 'true') {
        editor.focus();
        editor.execCommand('insertText', c);
        return 'ueditor';
      }
    }
  }

  var active = document.activeElement;
  if (active) {
    var tag = active.tagName ? active.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea') {
      var start = active.selectionStart || active.value.length;
      var end = active.selectionEnd || active.value.length;
      active.value = active.value.substring(0, start) + c + active.value.substring(end);
      active.selectionStart = active.selectionEnd = start + 1;
      active.dispatchEvent(new Event('input', { bubbles: true }));
      return 'input';
    } else if (active.isContentEditable || (active.getAttribute && active.getAttribute('contenteditable') === 'true')) {
      active.focus();
      document.execCommand('insertText', false, c);
      return 'contenteditable';
    }
  }
  return 'none';
})();