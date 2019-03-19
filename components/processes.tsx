import { Component } from "react"
import { Layout, Menu, Icon, Empty } from 'antd'
const { Content, Sider } = Layout;
import NewProcess from "./newProcess";
import DvoteUtil from "../utils/dvoteUtil";

interface State {
    selectedProcess: string
}

interface Props {
    processesMetadata: any,
    dvote: DvoteUtil
}

export default class processes extends Component<Props, State> {

    state = {
        selectedProcess: ""
    }

    renderMenu() {
        return Object.keys(this.props.processesMetadata).map((processId) => {
            let processMetadata = this.props.processesMetadata[processId]
            return <Menu.Item key={processMetadata.id}>{processMetadata.name}</Menu.Item>
        });
    }

    onMenuClick = (e) => {
        this.setState({ selectedProcess: e.key })
    }

    renderNoExistingProcessMessage = () => {
        return <Empty
            description="No exsisting processess for this address">
        </Empty>
    }

    renderEmptyPlaceholder = () => {
        return <Empty
            description="Select a process to display or create a new one">
        </Empty>
    }

    renderBody = () => {

        if (this.state.selectedProcess == "NEW_PROCESS_KEY")
            return <NewProcess dvote={this.props.dvote} />

        if (!Object.keys(this.props.processesMetadata).length)
            return this.renderNoExistingProcessMessage()

        if (!this.state.selectedProcess)
            return this.renderEmptyPlaceholder()

        let metadata = this.props.processesMetadata[this.state.selectedProcess]

        if (!metadata)
            return this.renderEmptyPlaceholder()

        return <div>
            <h2>{metadata.name}</h2>
            <code style={{ color: "#ccc" }}>{metadata.id}</code>
            <h4 style={{ marginTop: 20 }}>{metadata.question}</h4>
            <ul>
                {metadata.votingOptions.map(option => <li key={option}>{option}</li>)}
            </ul>
        </div>
    }

    render() {
        return <Layout style={{ background: '#fff' }}>
            <Sider
                width={200}
                style={{ background: '#fff' }}>
                <Menu
                    mode="inline"
                    defaultSelectedKeys={['']}
                    defaultOpenKeys={['Processes']}
                    onClick={this.onMenuClick}
                    style={{ height: '100%' }}
                >
                    <Menu.Item key={"NEW_PROCESS_KEY"} >
                        <span><Icon type="plus" />New process</span>
                    </Menu.Item>

                    {this.renderMenu()}
                </Menu>
            </Sider>
            <Content style={{ marginLeft: 30, minHeight: 280, minWidth: 300 }}>
                {this.renderBody()}
            </Content>
        </Layout>
    }
}

