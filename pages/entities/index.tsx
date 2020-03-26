import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
import { message, Spin } from 'antd'
import { getGatewayClients, getNetworkState } from '../../lib/network'
import { API, EntityMetadata, GatewayBootNodes } from "dvote-js"
const { Entity } = API
import QRCode from "qrcode.react"
import Link from "next/link"
// import MainLayout from "../../components/layout"
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

const ETH_NETWORK_ID = process.env.ETH_NETWORK_ID

// MAIN COMPONENT
const EntityViewPage = props => {
  // Get the global context and pass it to our stateful component
  const context = useContext(AppContext)

  return <EntityView {...context} />
}

type State = {
  entityLoading?: boolean,
  entity?: EntityMetadata,
  entityId?: string
}

// Stateful component
class EntityView extends Component<IAppContext, State> {
  state: State = {}

  async componentDidMount() {
    this.props.setTitle("Loading")

    try {
      const entityId = location.hash.substr(2)
      this.setState({ entityLoading: true, entityId })

      const { web3Gateway, dvoteGateway } = await getGatewayClients()
      const entity = await Entity.getEntityMetadata(entityId, web3Gateway, dvoteGateway)
      if (!entity) throw new Error()

      this.setState({ entity, entityId, entityLoading: false })
      this.props.setTitle(entity.name["default"])
    }
    catch (err) {
      this.setState({ entityLoading: false })
      message.error("Could not read the entity metadata")
    }
  }

  renderEntityInfo() {
    const entityId = location.hash.substr(2)
    let subscriptionLink = `vocdoni://vocdoni.app/entity?entityId=${entityId}&`
    const { bootnodesReadOnly } = getNetworkState()
    if (Object.keys(bootnodesReadOnly).length >= 1) {
      subscriptionLink += bootnodesReadOnly[ETH_NETWORK_ID].web3.map(n => `entryPoints[]=${n.uri}`).join("&")
    }

    return <>
      <img src={this.state.entity.media.avatar} className="avatar" />
      <p>
        <QRCode value={subscriptionLink} size={256} />
      </p>
      <h4>{this.state.entity.name["default"]}</h4>
      <p>{this.state.entity.description["default"]}</p>
      <pre>{JSON.stringify(this.state.entity, null, 2)}</pre>
      {/* <p><Link href={`/entities/edit/#/${this.state.entityId}`}><a><Button>Manage my entity</Button></a></Link></p> */}
    </>
  }

  renderNotFound() {
    return <>
      <h4>Entity not found</h4>
      <p>The entity you are looking for cannot be found</p>
    </>
  }

  renderLoading() {
    return <div>Please, wait... <Spin size="small" /></div>
  }

  render() {
    return <div id="entity-view">
      {
        this.state.entityLoading ? this.renderLoading() :
          this.state.entity ? this.renderEntityInfo() : this.renderNotFound()
      }
    </div>
  }
}


// // Using a custom layout
// EntityViewPage.Layout = props => <MainLayout>
//   {props.children}
// </MainLayout>

export default EntityViewPage
