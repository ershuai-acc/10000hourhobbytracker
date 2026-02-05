if (typeof AbortController === 'undefined') {
  (global as any).AbortController = class AbortController {
    signal = { aborted: false }
    abort() {
      this.signal.aborted = true
    }
  }
}
