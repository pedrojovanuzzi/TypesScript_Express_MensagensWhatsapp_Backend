class Login{

    static login(req: any, res: any) {
        const { username, password } = req.body
        const validUser = process.env.LOGIN
        const validPass = process.env.PASS
      
        if (username === validUser && password === validPass) {
          res.json({ success: true, user: { name: username } })
          return
        } else {
          res.status(401).json({ success: false, message: 'Credenciais inválidas' })
          return
        }
    }

}

export default Login;