const UserProfile = async ({ params }: any) => {

  const { id } = await params;
  // note: if we add the decorator 'use client', then we need to remove the async above and use React.use(params) instead of await. 

  return (
    <div>User profile for {id}</div>
  )
}

export default UserProfile