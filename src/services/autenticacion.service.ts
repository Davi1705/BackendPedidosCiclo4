import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import { Usuario } from '../models';
import { UsuarioRepository } from '../repositories';
import { Llaves } from '../config/llaves';
const generador = require("password-generator");
const cryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
@injectable({scope: BindingScope.TRANSIENT})
export class AutenticacionService {
  constructor(
    @repository(UsuarioRepository)
    public usuariorepository: UsuarioRepository
  ) { }
  /*
   * Add service methods here
   */
  GenerarClave() {
    let clave = generador(8, false);//8longitud clave, false dificultad clave
    return clave;
  }

  CifrarClave(clave: string){
    let claveCifrada = cryptoJS.MD5(clave).toString();
    return claveCifrada;
  }

  IdentificarUsuario(usuario: string, clave: string) {
    try{
      let p = this.usuariorepository.findOne({where:{correo: usuario, clave: clave}});
      if(p) {
        return p
      }
    }catch{
    }
  }
  GenerarTokenJWT(usuario: Usuario){
    let token = jwt.sign({
      data:{
        id: usuario.id,
        correo: usuario.correo,
        nombre: usuario.nombres + " " + usuario.apellidos
      }
    },
      Llaves.claveJWT);
    return token;
  }
  ValidarTokenJWT(token: string) {
    try{
      let datos = jwt.verify(token, Llaves.claveJWT)
      return datos;
    }catch{
      return false;
    }
  }

}

