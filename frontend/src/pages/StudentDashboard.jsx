import { useNavigate } from 'react-router-dom'

export default function StudentDashboard() {
  const name = localStorage.getItem('bandup_name') || 'Student'
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('bandup_token')
    localStorage.removeItem('bandup_role')
    localStorage.removeItem('bandup_name')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <header className="px-6 h-16 flex items-center justify-between border-b-2 border-[#151313]">
        <span className="text-xl font-black text-[#151313]">
          Band<span className="text-[#E9424C]">Up</span>
          <span className="ml-2 text-xs font-semibold bg-[#E9424C] text-white px-2 py-0.5 rounded-full">
            Student
          </span>
        </span>
        <button
          onClick={handleLogout}
          className="text-sm font-black text-[#E9424C] hover:underline"
        >
          Logout
        </button>
      </header>

      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <h1 className="text-3xl font-black text-[#151313]">
          Hello, <span className="text-[#E9424C]">{name}</span>
        </h1>
      </div>
    </div>
  )
}
