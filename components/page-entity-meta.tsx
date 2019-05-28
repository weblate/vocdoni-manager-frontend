import { Component } from "react"
import DvoteUtil from "../util/dvoteUtil"
import CreateEntity from "./fragment-create-entity"
import { Row, Col, Divider } from "antd"

import { headerBackgroundColor } from "../lib/constants"

import { Layout } from 'antd'
const { Header } = Layout

interface Props {
    entityDetails: object,
    currentAddress: string,
    refresh?: () => void
}
interface State {
}

export default class PageEntity extends Component<Props, State> {
    dvote: DvoteUtil

    componentDidMount() {
        this.dvote = new DvoteUtil()
    }

    renderMainContent() {
        // NO ENTITY => CREATE
        if (this.props.currentAddress && (!this.props.entityDetails || !this.props.entityDetails.exists)) {
            return <div style={{ padding: 30 }}>
                <CreateEntity
                    defaultCensusRequestUrl={process.env.CENSUS_REQUEST_URL}
                    currentAddress={this.props.currentAddress}
                />
            </div>
        }

        // ENTITY => SHOW
        return <div style={{ padding: 30 }}>
            <h2>Entity</h2>
            <Row>
                <Col span={12}>
                    <h4>Name</h4>
                    <p>{this.props.entityDetails.name}</p>
                    <h4>Created</h4>
                    <p>{this.props.entityDetails.exists ? "Yes" : "No"}</p>
                </Col>
                <Col span={12}>
                    <h4>(Census req)</h4>
                    <p>{this.props.entityDetails.censusRequestUrl}</p>
                    <h4>Address</h4>
                    <p>{this.props.entityDetails.address}</p>
                </Col>
            </Row>


            <Divider />
            <pre>{JSON.stringify(this.props.entityDetails, null, 2)}</pre>
            <div>{this.props.currentAddress}</div>
        </div>
    }

    render() {
        return <>
            <Header style={{ backgroundColor: headerBackgroundColor }}>
                { /* TITLE? */}
            </Header>

            <div style={{ padding: '24px ', paddingTop: 0, background: '#fff' }}>
                {this.renderMainContent()}
            </div>
        </>
    }
}
