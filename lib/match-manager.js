const _ = require('underscore-plus')
const {CompositeDisposable} = require('atom')

module.exports =
class MatchManager {
  appendPair (pairList, [itemLeft, itemRight]) {
    const newPair = {}
    newPair[itemLeft] = itemRight
    pairList = _.extend(pairList, newPair)
  }

  processAutoPairs (autocompletePairs, pairedList, dataFun) {
    if (autocompletePairs.length) {
      for (let autocompletePair of autocompletePairs) {
        const pairArray = autocompletePair.split('')
        this.appendPair(pairedList, dataFun(pairArray))
      }
    }
  }

  updateConfig () {
    this.pairedCharacters = {}
    this.pairedCharactersInverse = {}
    this.pairRegexes = {}
    this.pairsWithExtraNewline = {}
    if (this.edit) {
      this.processAutoPairs(this.getScopedSetting('bracket-matcher-custom.autocompleteCharacters'), this.pairedCharacters, x => [x[0], x[1]])
      this.processAutoPairs(this.getScopedSetting('bracket-matcher-custom.autocompleteCharacters'), this.pairedCharactersInverse, x => [x[1], x[0]])
    }
    else {
      this.processAutoPairs(this.getScopedSetting('bracket-matcher-custom.automatchCharacters'), this.pairedCharacters, x => [x[0], x[1]])
      this.processAutoPairs(this.getScopedSetting('bracket-matcher-custom.automatchCharacters'), this.pairedCharactersInverse, x => [x[1], x[0]])
    }
    this.processAutoPairs(this.getScopedSetting('bracket-matcher-custom.pairsWithExtraNewline'), this.pairsWithExtraNewline, x => [x[0], x[1]])
    for (let startPair in this.pairedCharacters) {
      const endPair = this.pairedCharacters[startPair]
      this.pairRegexes[startPair] = new RegExp(`[${_.escapeRegExp(startPair + endPair)}]`, 'g')
    }
  }

  getScopedSetting (key) {
    return atom.config.get(key, {scope: this.editor.getRootScopeDescriptor()})
  }

  constructor (editor, editorElement, edit) {
    this.destroy = this.destroy.bind(this)
    this.editor = editor
    this.subscriptions = new CompositeDisposable()
    this.edit = edit;

    this.updateConfig()

    // Subscribe to config changes
    const scope = this.editor.getRootScopeDescriptor()
    this.subscriptions.add(
      atom.config.observe('bracket-matcher-custom.autocompleteCharacters', {scope}, () => this.updateConfig()),
      atom.config.observe('bracket-matcher-custom.automatchCharacters', {scope}, () => this.updateConfig()),
      atom.config.observe('bracket-matcher-custom.pairsWithExtraNewline', {scope}, () => this.updateConfig()),
      this.editor.onDidDestroy(this.destroy)
    )

    this.changeBracketsMode = false
  }

  destroy () {
    this.subscriptions.dispose()
  }
}
