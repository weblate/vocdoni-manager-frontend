import { Component } from 'react'
import Link from 'next/link'
import { message, Button, Spin, Divider, Input, Select, Col, Row, Card, Modal } from 'antd'
import { LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { EntityMetadata } from 'dvote-js'
import Router from 'next/router'

import { IWallet } from '../lib/types'
import AppContext from '../components/app-context'

// import MainLayout from "../components/layout"
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

type State = {
    entityLoading?: boolean,
    entity?: EntityMetadata,
    address?: string,

    storedWallets?: IWallet[],

    selectedWallet?: string,
    passphrase?: string,
}

// Stateful component
class IndexView extends Component<undefined, State> {
    static contextType = AppContext
    context!: React.ContextType<typeof AppContext>

    state: State = {}

    async componentDidMount() {
        this.context.setMenuVisible(false)

        try {
            this.redirectToEntityIfAvailable();

            const storedWallets = await this.context.web3Wallet.getStored();
            this.setState({ storedWallets });
            if (storedWallets.length > 0) {
                this.setState({ selectedWallet: storedWallets[0].name });
            }
        }
        catch (err) {
            this.setState({ entityLoading: false })
            if (err && err.message === "The given entity has no metadata defined yet") {
                return // nothing to show
            }
            console.error(err)
            message.error("Could not connect to the network")
        }
    }

    async redirectToEntityIfAvailable() {
        if (this.context.web3Wallet.hasWallet()) {
            this.setState({ entityLoading: true })
            const address = await this.context.web3Wallet.getAddress()

            try {
                await this.context.refreshEntityMetadata(address)

                this.setState({ entityLoading: false })
                Router.push(`/entities/#/${address}`);
            } catch (e) {
                console.error(e)
                Modal.confirm({
                    title: "Entity not found",
                    icon: <ExclamationCircleOutlined />,
                    content: "It looks like your account is not linked to an existing entity. Do you want to create it now?",
                    okText: "Create Entity",
                    okType: "primary",
                    cancelText: "Not now",
                    onOk: () => {
                        Router.push("/entities/new")
                    },
                    onCancel: () => {
                        // Router.reload()
                        this.setState({ entityLoading: false })
                    },
                })
            }
        }
    }

    onWalletSelectChange = (name: string) => {
        this.setState({ selectedWallet: name });
    }

    onPassphraseChange = (passphrase: string) => {
        this.setState({ passphrase });
    }

    unlockWallet() {
        return this.context.web3Wallet.load(this.state.selectedWallet, this.state.passphrase)
            .then(() => {
                this.context.onNewWallet(this.context.web3Wallet.getWallet())
                this.setState({ passphrase: "" })
                return this.redirectToEntityIfAvailable()
            })
            .catch(() => message.error("Could not unlock the wallet. Please, check your password."))
    }

    renderEntityInfo() {
        return <>
            <h4>{this.context.entity.name.default}</h4>
            <div dangerouslySetInnerHTML={{__html: this.context.entity.description.default}} />
            <p><Link href={`/entities/edit#/${this.context.address}`}><a><Button>Manage my entity</Button></a></Link></p>
        </>
    }

    renderGetStarted() {
        const showStored = (this.state.storedWallets && this.state.storedWallets.length > 0);
        return <>
            {showStored &&
                <>
                    <p>From this page you can create and manage your entity, publish news, manage censuses and create voting processes.</p>
                    <Select onChange={this.onWalletSelectChange} defaultValue={this.state.storedWallets[0].name} style={{ width: '100%', marginBottom: 10 }}>
                        {this.state.storedWallets.map((w) => <Select.Option key={w.name} value={w.name}>{w.name}</Select.Option>)}
                    </Select>

                    <Input.Group compact>
                        <Input onChange={val => this.onPassphraseChange(val.target.value)} onPressEnter={() => this.unlockWallet()} type="password" placeholder="Password" style={{ width: "75%" }} />
                        <Button type='primary' onClick={() => this.unlockWallet() } style={{ width: "25%" }}>Sign in</Button>
                    </Input.Group>

                    <Divider>or</Divider>

                    <div style={{ textAlign: "center" }}>
                        <Link href="/account/import"><Button>Import an Entity</Button></Link>
                    </div>
                    <Divider>or</Divider>
                </>
            }

            <div style={{ textAlign: "center" }}>
                <Link href="/account/new"><Button type="primary">Create an Entity</Button></Link>
            </div>

            {!showStored &&
                <>
                    <Divider>or</Divider>
                    <div style={{ textAlign: "center" }}>
                        <Link href="/account/import"><Button>Import an Entity</Button></Link>
                    </div>
                </>
            }
        </>;
    }

    renderLoading() {
        return <div>Please, wait... <Spin indicator={<LoadingOutlined />} /></div>
    }

    render() {
        return <div id="index">
            <Row justify="center" align="middle">
                <Col xs={24} sm={18} md={10}>
                    <Card title="Vocdoni Manager" className="card">
                        {
                            this.context.loadingEntityMetadata ? this.renderLoading() :
                                (this.context.entity ? this.renderEntityInfo() : this.renderGetStarted())
                        }
                    </Card>
                </Col>
            </Row>
        </div>
    }
}

export default IndexView
