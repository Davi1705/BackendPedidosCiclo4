import { asService, service } from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del, get,
  getModelSchemaRef, HttpErrors, param, patch, post, put, requestBody,
  response
} from '@loopback/rest';
import { serviceProxy } from '@loopback/service-proxy';
import {Llaves} from '../config/llaves';
import {Credenciales, Usuario} from '../models';
import {UsuarioRepository} from '../repositories';
import {AutenticacionService} from '../services';
const fetch = require('node-fetch');

export class UsuarioController {
  constructor(
    @repository(UsuarioRepository)
    public usuarioRepository: UsuarioRepository,
    @service(AutenticacionService)
    public servicioAutenticacion: AutenticacionService
  ) { }


  @post("/identificarUsuario", {
    responses:{
      '200':{
        descrption: "Identificación de usuarios"
      }
    }
  })
  async IdentificarUsuario(
    @requestBody() credenciales: Credenciales
  ){
  let p = await this.servicioAutenticacion.IdentificarUsuario(credenciales.usuario, credenciales.clave);
  if (p){
    let token = this.servicioAutenticacion.GenerarTokenJWT(p);
    return{
      datos: {
        nombre: p.nombres,
        correo: p.correo,
        id: p.id
      },
      tk: token
    }
  }else{
    throw new HttpErrors[401]("datos inválidos")
  }
  }

  @post('/usuarios')
  @response(200, {
    description: 'Usuario model instance',
    content: {'application/json': {schema: getModelSchemaRef(Usuario)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {
            title: 'NewUsuario',
            exclude: ['id'],
          }),
        },
      },
    })
    usuario: Omit<Usuario, 'id'>,
  ): Promise<Usuario> {
    let clave = this.servicioAutenticacion.GenerarClave();
    let claveCifrada = this.servicioAutenticacion.CifrarClave(clave);
    usuario.clave = claveCifrada;
    let p = await this.usuarioRepository.create(usuario);

// notificación al usuario por correo electronico
    let destino = usuario.correo;
    let asunto = 'Registro en la plataforma de prueba';
    let contenido = `hola, este es un mensaje para ${usuario.nombres}, su usuario es: ${usuario.correo} y su contraseña es ${clave}`;

    fetch(`${Llaves.urlServicioNotificaciones}/envioCorreo?correo_destino=${destino}&asunto=${asunto}&contenido=${contenido}`)
      .then((data: any)=>{
        console.log(data);
      })
    return p;
  }

  @get('/usuarios/count')
  @response(200, {
    description: 'Usuario model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.count(where);
  }

  @get('/usuarios')
  @response(200, {
    description: 'Array of Usuario model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Usuario, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Usuario) filter?: Filter<Usuario>,
  ): Promise<Usuario[]> {
    return this.usuarioRepository.find(filter);
  }

  @patch('/usuarios')
  @response(200, {
    description: 'Usuario PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.updateAll(usuario, where);
  }

  @get('/usuarios/{id}')
  @response(200, {
    description: 'Usuario model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Usuario, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Usuario, {exclude: 'where'}) filter?: FilterExcludingWhere<Usuario>
  ): Promise<Usuario> {
    return this.usuarioRepository.findById(id, filter);
  }

  @patch('/usuarios/{id}')
  @response(204, {
    description: 'Usuario PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.updateById(id, usuario);
  }

  @put('/usuarios/{id}')
  @response(204, {
    description: 'Usuario PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.replaceById(id, usuario);
  }

  @del('/usuarios/{id}')
  @response(204, {
    description: 'Usuario DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.usuarioRepository.deleteById(id);
  }
}
