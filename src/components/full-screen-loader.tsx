import NaeLoader from './nae-loader'

const FullScreenLoader = () => {
  return (
    <div className='min-h-screen flex items-center justify-center'>
      <NaeLoader className='w-10 h-10' />
    </div>
  )
}

export default FullScreenLoader