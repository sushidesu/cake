import * as chromeStorage from './chromeApi'
import { IShopItem, EMPTY_ITEM } from './item'
import { zip, uniqueId } from './util'
import { EVENTS } from './constant'

export class Model {
  ready: Promise<void>
  private _itemList: { [id: string]: IShopItem }
  private _idList: string[]
  private _id: string | null
  dispatcher: HTMLDivElement
  private _datachange: Event
  private _selectchange: Event

  constructor() {
    this.ready = this.init()
    this.dispatcher = document.createElement('div')
    this._datachange = new Event(EVENTS.DATA_CHANGE)
    this._selectchange = new Event(EVENTS.SELECT_CHANGE)

    this.dispatcher.addEventListener(EVENTS.DATA_CHANGE, async () => {
      await Promise.all([
        chromeStorage.setItemlist(this._itemList),
        chromeStorage.setIdlist(this._idList)
      ])
      console.log('dataChange')
      console.log(this._itemList)
    })
    this.dispatcher.addEventListener(EVENTS.SELECT_CHANGE, async () => {
      await chromeStorage.setLastSelectedId(this._id)
      console.log('selectChange')
      console.log(this.getSelectedItem())
    })
  }

  init = async (): Promise<void> => {
    const promises = [
      (this._itemList = await chromeStorage.getItemlist()),
      (this._idList = await chromeStorage.getIdlist()),
      (this._id = await chromeStorage.getLastSelectedId())
    ]

    await Promise.all(promises)
  }

  getTitleList = (): { title: string; id: string }[] => {
    return this._idList.map(id => ({ title: this._itemList[id].name, id: id }))
  }

  getId = (): string | null => {
    return this._id
  }

  getSelectedItem = (): IShopItem => {
    return this._id === null ? EMPTY_ITEM : this._itemList[this._id]
  }

  select = (id: string | null): void => {
    this._id = id
    this.dispatcher.dispatchEvent(this._selectchange)
  }

  update = (form: FormData): void => {
    if (!this._itemList.hasOwnProperty(this._id)) {
      alert('no index')
    }

    this._itemList[this._id] = this.form_to_item(this._id, form)
    this.dispatcher.dispatchEvent(this._datachange)
    this.select(this._id) // sidebarが再描画されるのでハイライト
  }

  new = (form: FormData): void => {
    const newid = uniqueId()
    this._itemList[newid] = this.form_to_item(newid, form)
    this._idList.push(newid)
    this.dispatcher.dispatchEvent(this._datachange)
    this.select(newid)
  }

  delete = (): void => {
    delete this._itemList[this._id]
    const index = this._idList.findIndex(id => id === this._id)
    if (index === -1) {
      alert('no index')
    }
    this._idList = this._idList.filter(id => id !== this._id)
    this.dispatcher.dispatchEvent(this._datachange)

    if (this._idList.length === 0) {
      this.select(null) // リストが空の場合は空のアイテムを選択
    } else if (index > 0) {
      this.select(this._idList[index - 1]) // それ以外は一つ前のアイテムを選択
    } else {
      this.select(this._idList[0]) // 先頭が削除された場合は次に先頭のアイテムを選択
    }
  }

  dispatchEvents = (): void => {
    this.dispatcher.dispatchEvent(this._datachange)
    this.dispatcher.dispatchEvent(this._selectchange)
  }

  private form_to_item = (id: string, form: FormData): IShopItem => {
    return {
      id: id,
      name: form.get('name').toString(),
      price: form.get('price').toString(),
      weight: form.get('weight').toString(),
      rakuten_stock: form.get('rakuten_stock').toString(),
      makeshop_stock: form.get('makeshop_stock').toString(),
      jancode: form.get('jancode').toString(),
      descriptions: this.convert('description', form),
      details: this.convert('detail', form)
    }
  }

  private convert = (
    type: 'description' | 'detail',
    form: FormData
  ): { title: string; body: string }[] => {
    const titles = form.getAll(`${type}_title`)
    const bodies = form.getAll(`${type}_body`)

    // 入力欄が存在しない、または空欄の場合は空のリストを返す
    if (titles.length === 0 || titles[0] === '') {
      return []
    }

    return zip(
      (t, b) => ({ title: t.toString(), body: b.toString() }),
      titles,
      bodies
    )
  }
}
