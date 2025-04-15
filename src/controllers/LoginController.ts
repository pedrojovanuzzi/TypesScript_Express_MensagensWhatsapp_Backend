class Login{

    public login(req: any, res: any) {
        const { username, password } = req.body
        const validUser = process.env.LOGIN
        const validPass = process.env.PASS
      
        if (username === validUser && password === validPass) {
          return res.json({ success: true, user: { name: username } })
        } else {
          return res.status(401).json({ success: false, message: 'Credenciais inválidas' })
        }
    }

}