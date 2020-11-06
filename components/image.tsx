import { fetchFileBytes } from 'dvote-js/dist/api/file'
import React, { Component, ReactNode } from 'react'
import { Uint8ToString } from '../lib/file-utils'
import { getGatewayClients } from '../lib/network'

type State = {
    image: string,
    remote: string,
}

interface ImageProps {
    src: string,
    className?: string,
    alt?: string,
    onError?: (e: any) => void,
}

const getImageSource = async (src: string) : Promise<string> => {
    if (src.indexOf('ipfs') !== 0) {
        return src
    }

    try {
        const gw = await getGatewayClients()
        const file = await fetchFileBytes(src, gw)
        const decoded = Uint8ToString(file)
        const image = btoa(decoded)

        return `data:image/png;base64,${image}`
    } catch (error) {
        console.error('Error loading image from ipfs', error)
        return ''
    }
}

export default class Image extends Component<ImageProps, State> {
    state = {
        image: '',
        remote: '',
    }

    static getDerivedStateFromProps(props: ImageProps, state : State) : State {
        if (props.src !== state.image) {
            return {
                ...state,
                image: props.src,
            }
        }

        return state
    }

    async componentDidUpdate(prevProps: ImageProps, prevState: State) : Promise<void> {
        if (prevState.image !== this.state.image) {
            const image = await getImageSource(this.state.image)
            this.setState({
                image,
                // note that this will store different values when is an ipfs:// link type
                remote: image,
            })
        }

        return
    }

    async componentDidMount() : Promise<void> {
        const { image } = this.state
        const defined = image?.length
        const reload = image?.length && image.indexOf('ipfs') === 0

        if (!defined || reload) {
            const image = await getImageSource(this.props.src)
            this.setState({
                // note that this will store different values when is an ipfs:// link type
                remote: image,
            })
        }
    }

    render() : ReactNode {
        let image = this.state.image
        if (this.state.remote?.length && image !== this.state.remote) {
            image = this.state.remote
        }

        if (!image?.length || (image?.length && image.indexOf('ipfs') === 0 && !this.state.remote)) {
            return null
        }

        return (
            <img
                {...this.props}
                src={image}
            />
        )
    }
}
