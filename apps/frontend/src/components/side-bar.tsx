'use client';

import { useEffect } from 'react';
import { useApi } from '../lib/api-client';

export function SideBar(){
  const {get} = useApi()
  useEffect(()=>{
    getChats()
  },[])
  function getChats(){
    get('/chats').then(res=>{
      console.log(res);
    })
  }
  return(<>

  </>)
}
