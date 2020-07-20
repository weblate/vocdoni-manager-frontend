import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
import { message, Spin, Button, Input, Select, Divider, Menu, Row, Col, Modal } from 'antd'
import { InfoCircleOutlined, BookOutlined, FileImageOutlined, LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { getGatewayClients, getNetworkState } from '../../lib/network'
import { API, EntityMetadata, GatewayBootNodes } from "dvote-js"
// import { by639_1 } from 'iso-language-codes'
const { Entity } = API
import Link from "next/link"
import Router from 'next/router'
import { Wallet, Signer } from 'ethers'
import { updateEntity, getEntityId } from 'dvote-js/dist/api/entity'

// const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

// const { Option } = Select

// const languageCodes = Object.keys(by639_1).sort().reduce((prev, cur) => {
//   if (!prev.includes(cur)) prev.push(cur)
//   return prev
// }, [])

// MAIN COMPONENT
const EntityEditPage = props => {
    // Get the global context and pass it to our stateful component
    const context = useContext(AppContext)

    return <EntityEdit {...context} />
}

type State = {
  entityLoading?: boolean,
  entityUpdating?: boolean,
  entity?: EntityMetadata,
  entityId?: string,
  bootnodes?: GatewayBootNodes
}

// Stateful component
class EntityEdit extends Component<IAppContext, State> {
  state: State = {}

  async componentDidMount() {
      if (getNetworkState().readOnly) {
          return Router.replace("/entities" + location.hash)
      }
      // this.props.setTitle("Loading")

      try {
          await this.fetchMetadata()
      }
      catch (err) {
          message.error("Could not read the entity metadata")
      }
  }

  async fetchMetadata() {
      try {
          this.props.setMenuSelected("entity-edit")

          const entityId = location.hash.substr(2)
          this.setState({ entityLoading: true, entityId })

          const gateway = await getGatewayClients()
          const entity = await Entity.getEntityMetadata(entityId, gateway)
          if (!entity) throw new Error()

          this.setState({ entity, entityId, entityLoading: false })
          this.props.setTitle(entity.name.default)
          this.props.setEntityId(entityId)
      }
      catch (err) {
          this.setState({ entityLoading: false })
          throw err
      }
  }

  shouldComponentUpdate() {
      const entityId = location.hash.substr(2)
      if (entityId !== this.state.entityId) {
          this.fetchMetadata()
      }
      return true
  }

  // EVENTS
  onExistingLanguagesChange(languages) {
      const entity = Object.assign({}, this.state.entity, { languages })
      this.setState({ entity })
  }
  onExistingDefaultLanguageChange(language) {
      const defaultLang = this.state.entity.languages.filter(ln => ln === language)
      const otherLang = this.state.entity.languages.filter(ln => ln !== language)
      const entity = Object.assign({}, this.state.entity, { languages: defaultLang.concat(otherLang) })
      this.setState({ entity })
  }
  onNameChange(name: string, lang: string) {
      const newName = Object.assign({}, this.state.entity.name, { [lang]: name })
      const entity = Object.assign({}, this.state.entity, { name: newName })
      this.setState({ entity })
  }
  onDescriptionChange(description: string, lang: string) {
      const newDescription = Object.assign({}, this.state.entity.description, { [lang]: description })
      const entity = Object.assign({}, this.state.entity, { description: newDescription })
      this.setState({ entity })
  }
  onFieldChange(key: string, subkey: string, value: string) {
      if (subkey === null) {
          const entity = Object.assign({}, this.state.entity, { [key]: value })
          this.setState({ entity })
      }
      else {
          const entity = Object.assign({}, this.state.entity)
          if (typeof entity[key] !== "object") entity[key] = {}
          entity[key][subkey] = value
          this.setState({ entity })
      }
  }

  confirmUpdateMetadata() {
      const that = this;
      Modal.confirm({
          title: "Confirm",
          icon: <ExclamationCircleOutlined />,
          content: "The changes to the entity will become public. Do you want to continue?",
          okText: "Update Entity",
          okType: "primary",
          cancelText: "Not now",
          onOk() {
              that.updateMetadata()
          },
      })
  }

  async updateMetadata() {
      this.setState({ entityUpdating: true })

      const address = this.props.web3Wallet.getAddress()
      const balance = await this.props.web3Wallet.getProvider().getBalance(address)

      if (balance.lte(0)) {
          return Modal.warning({
              title: "Not enough balance",
              icon: <ExclamationCircleOutlined />,
              content: <span>To continue with the transaction you need to get some xDAI tokens. <br />Get in touch with us and copy the following address: <code>{address}</code></span>,
              onOk: () => {
                  this.setState({ entityUpdating: false })
              },
          })
      }

      const entity = Object.assign({}, this.state.entity)

      const idx = entity.actions.findIndex(act => act.type === "register")
      if (idx < 0) { // add it
          entity.actions.unshift({
              type: "register",
              actionKey: "register",
              name: { default: "Sign up" },
              url: process.env.REGISTER_URL,
              visible: process.env.ACTION_VISIBILITY_URL
          })
      }
      else { // update it
          entity.actions[idx].actionKey = "register"
          entity.actions[idx].url = process.env.REGISTER_URL
          entity.actions[idx].visible = process.env.ACTION_VISIBILITY_URL
      }

      // Filter extraneous actions
      entity.actions = entity.actions.filter(meta => !!meta.actionKey)

      return getGatewayClients().then(gateway => {
          const state = getNetworkState()
          return updateEntity(this.props.web3Wallet.getAddress(), entity, this.props.web3Wallet.getWallet() as (Wallet | Signer), gateway)
      }).then(newOrigin => {
          return this.fetchMetadata()
      }).then(() => {
          message.success("The entity has been updated")
          this.setState({ entityUpdating: false })
      }).catch(err => {
          message.error("The entity could not be updated")
          this.setState({ entityUpdating: false })
      })
  }

  // renderSupportedLanaguages(entity) {
  //   return <Row gutter={16}>
  //     <Col xs={24} md={12}>
  //       <label>Supported languages</label>
  //       <Select
  //         mode="multiple"
  //         style={{ width: '100%' }}
  //         placeholder="Select the supported languages"
  //         value={(entity.languages) || []}
  //         onChange={langs => this.onExistingLanguagesChange(langs)}
  //       >
  //         {languageCodes.map((lang, i) => <Option key={String(i)} value={lang}>{by639_1[lang].name}</Option>)}
  //       </Select>
  //     </Col>
  //     <Col xs={24} md={12}>
  //       <label>Default language</label>
  //       <Select
  //         style={{ width: '100%' }}
  //         placeholder="Select the default language"
  //         value={entity.languages[0] || ""}
  //         onChange={lang => this.onExistingDefaultLanguageChange(lang)}
  //       >
  //         {((entity.languages) || [] as any[]).filter(lang => by639_1[lang]).map((lang, i) => <Option key={String(i)} value={lang}>{by639_1[lang].name}</Option>)}
  //       </Select>
  //     </Col>
  //   </Row>
  // }

  renderEntityEdit() {
      const { entity: entity } = this.state

      return <div className="body-card">
          <Row justify="start">
              <Col xs={24} sm={20} md={14}>
                  <Divider orientation="left">Profile</Divider>
                  {/*<h2>Name</h2> */}
                  {
                      // (entity.languages).map(lang => <>
                      ['default'].map(lang => <div key={lang}>
                          {/* <label>Entity name ({by639_1[lang] ? by639_1[lang].name : lang})</label> */}
                          <label>Entity name</label>
                          <Input type="text"
                              value={entity.name[lang]}
                              prefix={<InfoCircleOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                              placeholder={"Entity name"}
                              onChange={val => this.onNameChange(val.target.value, lang)} />
                          <br /><br />
                      </div>)
                  }
                  {/* <h2>Description</h2> */}
                  {
                      // (entity.languages).map(lang => <>
                      ['default'].map(lang => <div key={lang}>
                          {/* <label>Description ({by639_1[lang] ? by639_1[lang].name : lang})</label> */}
                          <label>Description</label>
                          <Input type="text"
                              value={entity.description[lang]}
                              prefix={<BookOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                              placeholder={"Description"}
                              onChange={val => this.onDescriptionChange(val.target.value, lang)} />
                          <br /><br />
                      </div>)
                  }

                  <Divider orientation="left">Media</Divider>
                  {/* <h2>General</h2> */}
                  <label>Avatar (URL)</label>
                  <Input
                      placeholder="Link to an avatar icon"
                      prefix={<FileImageOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                      value={entity.media && entity.media.avatar}
                      onChange={ev => this.onFieldChange("media", "avatar", ev.target.value)}
                  />
                  <br /><br />
                  <label>Header Image (URL)</label>
                  <Input
                      placeholder="Link to a header image"
                      prefix={<FileImageOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                      value={entity.media && entity.media.header}
                      onChange={ev => this.onFieldChange("media", "header", ev.target.value)}
                  />
                  <br /><br />

                  <Divider />

                  <div style={{ textAlign: "center" }}>
                      {this.state.entityUpdating ?
                          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} />} /> :
                          <Button size='large' type='primary' onClick={() => this.confirmUpdateMetadata()}>Update metadata</Button>
                      }
                  </div>
              </Col>
              <Col xs={0} md={10} className="right-col">
                  <Divider orientation="left">Media</Divider>
                  <img src={this.state.entity.media.header} className="header-image" />
              </Col>
          </Row>
      </div>
  }

  renderNotFound() {
      return <div className="not-found">
          <h4>Entity not found</h4>
          <p>The entity you are looking for cannot be found</p>
      </div>
  }

  renderLoading() {
      return <div>Loading the details of the entity...  <Spin indicator={<LoadingOutlined />} /></div>
  }

  render() {
      return <div id="entity-edit">
          {
              this.state.entityLoading ?
                  <div id="page-body" className="center">
                      {this.renderLoading()}
                  </div>
                  :
                  this.state.entity ?
                      <div id="page-body">
                          {this.renderEntityEdit()}
                      </div>
                      : <div id="page-body" className="center">
                          {this.renderNotFound()}
                      </div>
          }
      </div >
  }
}


// // Custom layout
// EntityEditPage.Layout = props => <MainLayout>

//   <div>
//     {props.children}
//   </div>
// </MainLayout>

export default EntityEditPage
