import 'elysia'
import { JwtPayload } from './types'

declare module 'elysia' {
    interface Context {
        user: JwtPayload
    }
}