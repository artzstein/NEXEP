import React from 'react'
import { Link , useLocation} from "react-router-dom";
import logo from '../assets/logo.jpeg'


const Nav = () => {
  const location = useLocation();
  return (
    <>
    <div className='h-18 bg-black text-white grid grid-cols-[1fr_auto_1fr] items-center px-2 sticky top-0 z-50'>
      <li className='list-none justify-self-start'><Link to="/"><img src={logo} alt="" className='w-22 h-14 rounded m-2'/></Link></li>

      <div className='text-center text-xs sm:text-base font-semibold tracking-wide text-white px-2'>
        ABES Engineering College
      </div>

     <Link
  to="/login"
  className="justify-self-end inline-flex items-center justify-center mr-2 px-4 py-2 my-3 text-sm font-medium text-white bg-[rgba(130,131,133,0.5)] backdrop-blur-sm rounded-2xl border-2 border-transparent shadow-sm transform transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[rgba(130,131,133,0.7)] hover:border-blue-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 select-none"
>
  Sign Up
</Link>


      </div>
    </>
  )
}

export default Nav