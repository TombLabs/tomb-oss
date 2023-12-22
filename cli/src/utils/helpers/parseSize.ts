
export default function parseSize(size: string) {
    const amount = parseInt(size.split(/[a-zA-Z]/)[0])
    const unit = size.split(/[0-9]/)[1]
    return { amount, unit }
}